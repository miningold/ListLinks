var _ = require('lodash'),
    url = require('url'),
    request = require('request'),
    cheerio = require('cheerio'),
    data = require('../data');

exports.index = function(req, res) {
  res.render('index');
};

exports.updateCount = function(req, res, next) {
  data.upsert(req.url.substring(1), {url: req.body.target}, function(error, result) {
    if (error) {
      throw error;
    }
    res.send({status: result});
  });
};

exports.list = function(req, res, next) {
  var uri = req.url.substring(1),
      protocol = /^https?:\/\//,
      asdf = '';

  if (uri === '') {
    res.render('index');
    return;
  }

  // Add protocol to uri
  if (!protocol.test(uri)) {
    uri = 'http://' + uri;
  }

  request.get(uri, function(error, response, body) {
    var $, links,
        contentType;

    if (error) {
      return res.render('404', { url: uri });
    }

    // update evaluated uri
    uri = response.request.uri.href;
    console.log(uri);

    $ = cheerio.load(body);
    links = {};

    $('a').each(function(i, a) {
      var $link = $(a),
          href = $link.attr('href'),
          text = $link.html(),
          $image = $link.find('img').first(),
          src = $image.attr('src'),
          alt = $image.attr('alt');

      // ignore if href missing
      if (!href) {
        return;
      }

      // resolve urls
      href = url.resolve(uri, href);
      if (src) {
        src = url.resolve(uri, src);
      }

      // Ignore everything after the hashmark
      href = href.split('#')[0];

      // Ignore self links
      if (href === uri) {
        return;
      }

      // Remove html elements from text
      text = text.replace(/<(?:.|\n)*?>/gm, ' ');

      // Use alt if link is empty
      if (text.trim() === '') {
        if (alt) {
          text = alt;
        } else {
          text = href;
        }
      }

      // Use map to prevent dups
      links[href] = {
        text: text,
        src: src
      };
    });

    // Get list of popular links
    data.readPopular(uri, function(error, popular) {
      if (error) {
        return next(error);
      }

      popular = _.map(popular, function(obj) {
        return obj.url;
      });

      console.log(popular);

      // Convert map to array
      links = _.map(links, function(data, href) {
        if (_.contains(popular, href)) {
          data.popular = true;
        }
        data.href = href;
        return data;
      });

      // Convert to json and clean up
      var json = JSON.stringify(links);
      json = json.replace(/\\n/g, ' ');    // newline
      json = json.replace(/\\t/g, ' ');   // tabs
      json = json.replace(/\\/g, '\\\\'); // backslash
      json = json.replace(/\"/g, '\\\"'); // double quotes

      // Render  the pages
      res.render('list', {
        json: json,
        uri: uri
      });
    });
  });
};
