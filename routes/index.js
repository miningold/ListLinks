var parse = require('url').parse,
    request = require('request'),
    cheerio = require('cheerio');

exports.index = function(req, res){
  res.render('base');
};

exports.list = function(req, res) {
  var uri = req.params[0],
      protocol = /^https?:\/\//,
      url;

  // Add protocol to uri
  if (!protocol.test(uri)) {
    uri = 'http://' + uri;
  }

  url = parse(uri);

  request.get(uri, function(error, response, body) {
    var $, links,
        contentType;

    if (error) {
      console.dir(error);
      res.end();
      return;
    }

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
        href = url.protocol + '//' + url.host + href;
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

    res.render('list', {
      uri: uri,
      links: links
    });
  });

};
