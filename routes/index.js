var parse = require('url').parse,
    request = require('request'),
    cheerio = require('cheerio'),
    data = require('../data');

exports.index = function(req, res) {
  console.log('here');
  res.render('index');
};

exports.list = function(req, res, next) {
  var param = req.params[0],
      protocol = /^https?:\/\//,
      url, uri;

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



  url = parse(uri);

  request.get(uri, function(error, response, body) {
    var $, links,
        contentType;

    if (error) {
      console.dir(error);
      return next(error);
    }

    // data.upsert('foo.com', { url: uri }, function(error, result) {
    //   if (error) {
    //     throw error;
    //   }

    //   console.log('It worked: ' + result);
    // });

    contentType = response.headers['content-type'];

    if (contentType.indexOf('image') != -1) {
      // TODO (tylor): Draw image instead of list
      console.log('draw image');
      res.end();
      return;
    }

    $ = cheerio.load(body);
    links = [];

    $('a').each(function(i, a) {
      var $link = $(a),
          href = $link.attr('href'),
          text = $link.html()
          src = $link.find('img').first().attr('src');

      // Catch relative protocol paths
      if (/^\/\//.test(href)) {
        href = 'http:' + href;
      }

      // If relative path, expand to absolute path
      if (!protocol.test(href)) {
        if (!/^\//.test(href)) {
          href = '/' + href;
        }
        href = url.protocol + '//' + url.host + href;
      }

      if (src) {
        if (/^\/\//.test(src)) {
          src = 'http:' + src;
        }

        if (!protocol.test(src)) {

          if (!/^\//.test(src)) {
            src = '/' + src;
          }

          src = url.protocol + '//' + url.host + src;
        }
      }

      // Use href if link is empty
      if (text.trim() === '') {
        text = href;
      }

      links.push({
        href: '/' + href,
        text: text,
        src: src
      });
    });

    data.readPopular(uri, function(error, popular) {
      console.log(popular);
      res.render('list', {
        uri: uri,
        links: links,
        popular: popular
      });
    });

  });

};
