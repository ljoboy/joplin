const Entities = require('html-entities').AllHtmlEntities;
const htmlentities = (new Entities()).encode;
const Resource = require('lib/models/Resource.js');
const utils = require('../utils');

function installRule(markdownIt, mdOptions, ruleOptions) {
	const defaultRender = markdownIt.renderer.rules.image;

	markdownIt.renderer.rules.image = (tokens, idx, options, env, self) => {
		const token = tokens[idx];
		const src = utils.getAttr(token.attrs, 'src');
		const title = utils.getAttr(token.attrs, 'title');

		if (!Resource.isResourceUrl(src)) return defaultRender(tokens, idx, options, env, self);

		const resourceId = Resource.urlToId(src);
		const result = ruleOptions.resources[resourceId];
		const resource = result ? result.item : null;
		const resourceStatus = utils.resourceStatus(result);

		if (resourceStatus !== 'ready') {
			const icon = utils.resourceStatusImage(resourceStatus);
			return '<div class="not-loaded-resource resource-status-' + resourceStatus + '" data-resource-id="' + resourceId + '">' + '<img src="data:image/svg+xml;utf8,' + htmlentities(icon) + '"/>' + '</div>';
		}

		const mime = resource.mime ? resource.mime.toLowerCase() : '';
		if (Resource.isSupportedImageMimeType(mime)) {
			let realSrc = './' + Resource.filename(resource);
			if (ruleOptions.resourceBaseUrl) realSrc = ruleOptions.resourceBaseUrl + realSrc;
			let output = '<img data-from-md data-resource-id="' + resource.id + '" title="' + htmlentities(title) + '" src="' + realSrc + '"/>';
			return output;
		}

		return defaultRender(tokens, idx, options, env, self);
	};
}

module.exports = function(context, ruleOptions) {
	return function(md, mdOptions) {
		installRule(md, mdOptions, ruleOptions);
	};
};