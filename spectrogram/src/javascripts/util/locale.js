var locale = {};

// Convert query params to key-value pairs
const parseQueryString = () => {
  var query = window.location.search.slice(1).split('&');
  return query.map(param => {
    var pair = param.split('=');
    var key = pair[0];
    var value = pair[1];
    param = {};
    param[key] = value;
    return param;
  });
};

locale.getLocalization = () => {
  var params = parseQueryString();
  var langParam = params.find(param => {
    return param.ln !== undefined;
  });
  var lang = langParam ? langParam.ln : 'en';
  var url = `https://gweb-musiclab-site.appspot.com/static/locales/${ lang }/locale-music-lab.json`;
  $.ajax({
    url: url,
    dataType: `json`,
    async: true
  }).done(response => {
    for (var key in response) {
      var item = $(`[data-name='${ key }']`);
      if (item.length) {
        var value = response[key];
        console.log('value.message', value.message);
        item.attr('data-name', value.message);
      }
    }
  }).fail(error => {
    console.warn(error);
  });
}

module.exports = locale;