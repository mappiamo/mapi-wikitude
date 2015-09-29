var db;

// Some fake testing data
var Gal = {

  _getUrl: function (type, id) {

    var self = this;
    var url = this.server.url;

    if (type === 'content') {
      url += self.server._content;
    } else if (type === 'poi') {
      url += self.server._poi;
    } else if (type === 'page') {
      url += self.server._page;
    };

    url += id + this.server._jsonp;

    return url;

  },

  server: {
    _jsonp: '&callback=JSON_CALLBACK',
    _content: 'index.php?module=api&task=content&object=',
    _page: 'index.php?module=content&object=',
    _poi: 'index.php?module=api&task=category&object=',
    url: 'http://itinerari.galcapodileuca.it/'
  },

  // itinerari
  routes:[
    {
      title: 'Paduli',
      _content: '539',
      _categories: '37',
      name: 'Paduli',
      image: 'img/contents/paduli.jpg',
      description: 'Un percorso che si snoda lungo sei comuni del basso Salento, partendo da Nociglia, il comune più a nord, per toccare Montesano Salentino, Miggiano, Taurisano, Ruffano e Specchia.'
    },
    {
      title: 'Fede',
      _content: '538',
      _categories: '11',
      name: 'Fede',
      image: 'img/contents/fede.jpg',
      description: 'Un affascinante percorso costellato di chiese rurali, cripte, luoghi di ristoro, attraversando una campagna ricca di quelle testimonianze rurali tipiche del territorio salentino.'
    },
    {
      title: 'Naturalistico/Archeologico',
      _content: '541',
      _categories: '57',
      name: 'Naturalistico\/archeologico',
      image: 'img/contents/natura.jpg',
      description: 'Un percorso che attraversa i comuni di Ugento, Salve, Morciano di Leuca, Presicce ed Acquarica del Capo, fino a raggiungere il famoso Parco Naturale Litorale di Ugento.'
    },
    {
      title: 'Falesie',
      _content: '540',
      _categories: '54',
      name: 'Falesie',
      image: 'img/contents/falesie.jpg',
      description: 'Un percorso che si dispiega lungo la costa adriatica del Capo di Leuca, un paesaggio spettacolare dove il mare e la terra quasi si scontrano lungo la linea di costa, alta, rocciosa, costellata di grotte e insenature.'
    }
  ],

  pois: [],

  // punti di interesse ordinate per coordinate più vicine
  getPOIs: function (done, options) {
    
    var self = this;

    // per tutti gli itinerari
    async.each(self.routes, function (item, callback) {
      console.log('getting pois by ' + item._content);

      var l = 20;

      var _options = {
        _content: item._content,
        _category: item._categories,
        _random: options.random,
        _lat: options.lat,
        _lng: options.lng
      };

      self._getPOI(_options, function (err, data) {
        // console.log('getting pois Ok -> n.' + _.size(data));
        self._createPOIData(_options, data, function (err) {
          callback();
        });
      });

    }, function (err) {
      console.log('*** total pois: ' + _.size(self.pois));

      // ordinamento per coordinate      
      var d_sorted = _.sortBy(self.pois, function (item) {
        return self._distance(options.lat, options.lng, item.latitude, item.longitude);
      });

      // limita l'array
      var d_limit = _.first(d_sorted, options.limit);

      done(err, d_limit);
    });

  },

  _getJSON: function (url, done) {

    var jqxhr = $.getJSON( url, function(data) {
      console.log( "success get data." );
      done(false, data);
    })
    .done(function() {
      console.log( "second success" );
    })
    .fail(function() {
      console.log( "error" );
      done(true, null);
    })
    .always(function() {
      console.log( "complete" );
    });
 
    // Perform other work here ...
     
    // Set another completion function for the request above
    jqxhr.complete(function() {
      console.log( "second complete" );
    });

  },

  // punti di interesse da url
  _getPOI: function (options, callback) {
    
    var self = this;

    var url = this._getUrl('poi', options._category);

    console.log('getting data by: ' + url);

    this._getJSON(url, function (err, data) {
      if (err) {
        console.log('unable to get content data');
        callback(true, null);
      } else {
        console.log('get content data Ok.');
        callback(err, data);
      }
    });
  },

  // punti di interesse ordinate per coordinate più vicine
  _createPOIData: function (options, data, done) {

    var self = this;

    async.each(data, function (item, callback) {

      // console.log('-------------------');
      // console.log(JSON.stringify(item));

      var lat = 0;
      var lng = 0;

      var latReal = 0;
      var lngReal = 0;

      if (typeof item.lat != 'undefined') {
        lat = item.lat;
      } else {
        lat = (options._lat + (Math.random() / 5 - 0.1));
      };

      if (typeof item.lng != 'undefined') {
        lng = item.lng;
      } else {
        lng = (options._lng + (Math.random() / 5 - 0.1));
      };

      latReal = lat;
      lngReal = lng;

      if (options._random) {
        lat = (options._lat + (Math.random() / 5 - 0.1));
        lng = (options._lng + (Math.random() / 5 - 0.1));
      };

      // console.log('POI\'s coordinate: ' + lat + ',' + lng);

      var poiData = {
          id: item.id,
          content: options._content,
          category: options._category,
          longitude: lng,
          latitude: lat,
          latitudeReal: latReal,
          longitudeReal: lngReal,
          altitude: 0,
          description: item.address,
          // text: S(S(item.text).stripTags().s).decodeHTMLEntities().s,
          title: item.title,
          marker: 'img/markers/' + item.meta[1].value,
          link: self._getUrl('page', item.id)
      };

      self.pois.push(poiData);

      callback();

    }, function (err) {
      done(err)
    });

  },

  _decodeHTML: function (data, done) {
    
    async.each(data.data, function (item, callback) {
      item.text = S(S(item.text).stripTags().s).decodeHTMLEntities().s;
      callback();
    }, function (err) {
      done(err, data);
    });
  },

  // distance in meters 
  _distance: function (lat1, lng1, lat2, lng2) {
         
    var self = this;      
    var R = 6371; // Radius of the earth in km
    var dStr = "";

    var dLat = self._deg2rad(lat2-lat1);  // deg2rad below
    var dLon = self._deg2rad(lng2-lng1); 

    var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(self._deg2rad(lat1)) * Math.cos(self._deg2rad(lat2)) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);

    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    var d = Math.ceil((R * c) * 1000); // Distance in mt

    return d;

  },

  _deg2rad: function (deg) {
      return deg * (Math.PI/180)
  }
};