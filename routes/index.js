var _ = require('lodash'),
    fuzzy = require('fuzzy'),
    url = require('url'),
    request = require('request'),
    cheerio = require('cheerio'),
    data = require('../data');

exports.index = function(req, res) {
  res.render('index');
};

exports.updateCount = function(req, res, next) {
  data.upsert(req.url.substring(1), { url: req.body.target }, function(error, result) {
    if (error) {
      throw error;
    }
    res.send({ status: result });
  });
};

exports.list = function(req, res, next) {
  var uri = req.url.substring(1),
      protocol = /^https?:\/\//,
      asdf = '',
      uri;

  if (uri === '') {
    res.render('index');
    return;
  }

  // Add protocol to uri
  if (!protocol.test(uri)) {
    uri = 'http://' + uri;
  }

  console.log(uri);

  // uri += query;

  // console.log(uri);

  request.get(uri, function(error, response, body) {
    var $, links,
        contentType;

    if (error) {
      return res.render('404', { url: uri });
    }

    // Did we come from another list on listlinks?
    // if (req.query.prev) {
    //   // update popular counts
    //   data.upsert(req.query.prev, { url: uri }, function(error, result) {
    //     if (error) {
    //       throw error;
    //     }
    //   });

    //   // Redirect without query
    //   return res.redirect(pathname);
    // }

    // contentType = response.headers['content-type'];

    // if (contentType.indexOf('image') != -1) {
    //   // TODO (tylor): Draw image instead of list
    //   console.log('draw image');
    //   res.end();
    //   return;
    // }

    $ = cheerio.load(body);
    links = {};

    $('a').each(function(i, a) {
      var $link = $(a),
          href = $link.attr('href'),
          text = $link.html()
          $image = $link.find('img').first(),
          src = $image.attr('src')
          alt = $image.attr('alt');

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

      // Remove html elements from text
      text = text.replace(/<(?:.|\n)*?>/gm, ' ');

      // Use href if link is empty
      if (text.trim() === '') {
        text = alt;
      }

      if (!text || text.trim() === '') {
        text = href;
      }

      if (href === uri) {
        return;
      }

      href = '/' + href;

      // Use map to prevent dups
      links[href] = {
        text: text,
        src: src
      };
    });

    // Get list of popular links
    data.readPopular(uri, function(error, popular) {
      if (error) {
        throw error;
      }

      console.log(popular);

      // Convert map to array
      links = _.map(links, function(data, href) {
        // console.log(href);
        data.href = href;
        return data;
      });

      // Convert to json and clean up
      var json = JSON.stringify(links);
      json = json.replace(/\\n/g, '');
      json = json.replace(/\\t/g, ' ');
      json = json.replace(/\\/g, '\\\\');
      json = json.replace(/\"/g, '\\\"');

      // Render  the pages
      res.render('list', {
        json: json,
        uri: uri,
        links: links,
        popular: popular
      });
    });

  });

};
