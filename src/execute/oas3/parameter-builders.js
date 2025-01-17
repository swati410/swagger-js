import { resolve as resolvePathTemplate } from 'openapi-path-templating';

import stylize, { encodeCharacters } from './style-serializer.js';
import serialize from './content-serializer.js';

export function path({ req, value, parameter, pathName }) {
  const { name, style, explode, content } = parameter;

  if (value === undefined) return;

  let resolvedPathname;

  if (content) {
    const effectiveMediaType = Object.keys(content)[0];

    resolvedPathname = resolvePathTemplate(
      pathName,
      { [name]: value },
      { encoder: (val) => encodeCharacters(serialize(val, effectiveMediaType)) }
    );
  } else {
    resolvedPathname = resolvePathTemplate(
      pathName,
      { [name]: value },
      {
        encoder: (val) =>
          stylize({
            key: parameter.name,
            value: val,
            style: style || 'simple',
            explode: explode || false,
            escape: 'reserved',
          }),
      }
    );
  }

  req.url = req.url.replace(pathName, resolvedPathname);
}

export function query({ req, value, parameter }) {
  req.query = req.query || {};

  if (value !== undefined && parameter.content) {
    const effectiveMediaType = Object.keys(parameter.content)[0];
    const serializedValue = serialize(value, effectiveMediaType);

    if (serializedValue) {
      req.query[parameter.name] = serializedValue;
    } else if (parameter.allowEmptyValue) {
      const paramName = parameter.name;
      req.query[paramName] = req.query[paramName] || {};
      req.query[paramName].allowEmptyValue = true;
    }

    return;
  }

  if (value === false) {
    value = 'false';
  }

  if (value === 0) {
    value = '0';
  }

  if (value) {
    const { style, explode, allowReserved } = parameter;
    req.query[parameter.name] = {
      value,
      serializationOption: { style, explode, allowReserved },
    };
  } else if (parameter.allowEmptyValue && value !== undefined) {
    const paramName = parameter.name;
    req.query[paramName] = req.query[paramName] || {};
    req.query[paramName].allowEmptyValue = true;
  }
}

const PARAMETER_HEADER_BLACKLIST = ['accept', 'authorization', 'content-type'];

export function header({ req, parameter, value }) {
  req.headers = req.headers || {};

  if (PARAMETER_HEADER_BLACKLIST.indexOf(parameter.name.toLowerCase()) > -1) {
    return;
  }

  if (value !== undefined && parameter.content) {
    const effectiveMediaType = Object.keys(parameter.content)[0];

    req.headers[parameter.name] = serialize(value, effectiveMediaType);
    return;
  }

  if (value !== undefined && !(Array.isArray(value) && value.length === 0)) {
    req.headers[parameter.name] = stylize({
      key: parameter.name,
      value,
      style: parameter.style || 'simple',
      explode: typeof parameter.explode === 'undefined' ? false : parameter.explode,
      escape: false,
    });
  }
}

export function cookie({ req, parameter, value }) {
  req.headers = req.headers || {};
  const type = typeof value;

  if (value !== undefined && parameter.content) {
    const effectiveMediaType = Object.keys(parameter.content)[0];

    req.headers.Cookie = `${parameter.name}=${serialize(value, effectiveMediaType)}`;
    return;
  }

  if (value !== undefined && !(Array.isArray(value) && value.length === 0)) {
    const prefix =
      type === 'object' && !Array.isArray(value) && parameter.explode ? '' : `${parameter.name}=`;

    req.headers.Cookie =
      prefix +
      stylize({
        key: parameter.name,
        value,
        escape: false,
        style: parameter.style || 'form',
        explode: typeof parameter.explode === 'undefined' ? false : parameter.explode,
      });
  }
}
