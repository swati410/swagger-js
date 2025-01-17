import { resolve as resolvePathTemplate } from 'openapi-path-templating';

// These functions will update the request.
// They'll be given {req, value, paramter, spec, operation}.

export default {
  body: bodyBuilder,
  header: headerBuilder,
  query: queryBuilder,
  path: pathBuilder,
  formData: formDataBuilder,
};

// Add the body to the request
function bodyBuilder({ req, value }) {
  if (value !== undefined) {
    req.body = value;
  }
}

// Add a form data object.
function formDataBuilder({ req, value, parameter }) {
  if (value === false && parameter.type === 'boolean') {
    value = 'false';
  }

  if (value === 0 && ['number', 'integer'].indexOf(parameter.type) > -1) {
    value = '0';
  }

  if (value) {
    req.form = req.form || {};
    req.form[parameter.name] = {
      collectionFormat: parameter.collectionFormat,
      value,
    };
  } else if (parameter.allowEmptyValue && value !== undefined) {
    req.form = req.form || {};
    const paramName = parameter.name;
    req.form[paramName] = req.form[paramName] || {};
    req.form[paramName].allowEmptyValue = true;
  }
}

// Add a header to the request
function headerBuilder({ req, parameter, value }) {
  req.headers = req.headers || {};
  if (typeof value !== 'undefined') {
    req.headers[parameter.name] = value;
  }
}

// Replace path paramters, with values ( ie: the URL )
function pathBuilder({ req, value, parameter, pathName }) {
  if (value !== undefined) {
    const resolvedPathname = resolvePathTemplate(pathName, { [parameter.name]: value });

    req.url = req.url.replace(pathName, resolvedPathname);
  }
}

// Add a query to the `query` object, which will later be stringified into the URL's search
function queryBuilder({ req, value, parameter }) {
  req.query = req.query || {};

  if (value === false && parameter.type === 'boolean') {
    value = 'false';
  }

  if (value === 0 && ['number', 'integer'].indexOf(parameter.type) > -1) {
    value = '0';
  }

  if (value) {
    req.query[parameter.name] = {
      collectionFormat: parameter.collectionFormat,
      value,
    };
  } else if (parameter.allowEmptyValue && value !== undefined) {
    const paramName = parameter.name;
    req.query[paramName] = req.query[paramName] || {};
    req.query[paramName].allowEmptyValue = true;
  }
}
