var _ = require('lodash'),
    fuzzy = require('fuzzy'),
    url = require('url'),
    request = require('request'),
    cheerio = require('cheerio'),
    data = require('../data');

exports.index = function(req, res) {
  res.render('index');
};

exports.list = function(req, res, next) {
  var param = req.params[0],
      protocol = /^https?:\/\//,
      uri;

  param = param.trim();

  if (param === '') {
    res.render('index');
    return;
  }

  // Add protocol to uri
  if (!protocol.test(param)) {
    uri = 'http://' + param;
  } else {
    uri = param;
  }

  console.log(uri);

  request.get(uri, function(error, response, body) {
    var query = req.query.q,
        pathname  = url.parse(req.url).pathname,
        $, links,
        contentType;

    if (error) {
      console.dir(error);
      return next(error);
    }

    // Did we come from another list on listlinks?
    if (req.query.prev) {
      // update popular counts
      data.upsert(req.query.prev, { url: uri }, function(error, result) {
        if (error) {
          throw error;
        }
      });

      // Redirect without query
      return res.redirect(pathname);
    }

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
          src = $link.find('img').first().attr('src');

      // resolve urls
      href = url.resolve(uri, href);
      if (src) {
        src = url.resolve(uri, src);
      }

      // Remove html elements
      text = text.replace(/<(?:.|\n)*?>/gm, ' ');

      // Use href if link is empty
      if (text.trim() === '') {
        text = href;
      }

      href = '/' + href;

      // Use map to prevent dups
      links[href] = {
        text: text,
        src: src
      };
    });

    // convert map to array
    links = _.map(links, function(data, href) {
      data.href = href;
      return data;
    });

    // Is there a search query?
    if (query) {
      // Fuzzy search
      links = fuzzy.filter(query, links, {
        extract: function(el) {
          return el.text;
        }
      });

      // Get the originals
      links = _.map(links, function(link) {
        return link.original;
      });
    } else if (typeof query !== "undefined" && query !== null) {
      // Redirect to remove q query in case of ?q=
      return res.redirect(pathname);
    }

    // Get list of popular links
    data.readPopular(uri, function(error, popular) {
      if (error) {
        throw error;
      }
      console.log(popular);

      // Render  the pages
      res.render('list', {
        uri: uri,
        links: links,
        popular: popular,
        query: query
      });
    });

  });

};
