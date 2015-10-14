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
    url: 'http://itinerari.galcapodileuca.it/',
    api: 'http://itinerari.galcapodileuca.it/index.php?module=api&task=search&field=type&data=place&auth=dfgw4356dgfDSFGdsfgret3'
  },

  // itinerari
  routes:[
    {
        title: 'Paduli',
        _content: '665',
        _categories: '37',
        lang: {
          en: {
            _title: 'Paduli',
            _content: '669',
            _categories: '85'
          },
          it: {
            _title: 'Paduli',
            _content: '665',
            _categories: '37'
          }
        },
        name: 'Paduli',
        color: '#00CCCC',
        image: 'img/itinerari/paduli.jpg',
        description: 'Un percorso che si snoda lungo sei comuni del basso Salento, partendo da Nociglia, il comune più a nord, per toccare Montesano Salentino, Miggiano, Taurisano, Ruffano e Specchia.'
      },
      {
        title: 'Fede',
        _content: '664',
        _categories: '11',
        lang: {
          en: {
            _title: 'Fede',
            _content: '542',
            _categories: '62'
          },
          it: {
            _title: 'Fede',
            _content: '664',
            _categories: '11'
          }
        },
        color: '#FF00FF',
        name: 'Fede',
        image: 'img/itinerari/fede.jpg',
        description: 'Un affascinante percorso costellato di chiese rurali, cripte, luoghi di ristoro, attraversando una campagna ricca di quelle testimonianze rurali tipiche del territorio salentino.'
      },
      {
        title: 'Naturalistico/Archeologico',
        _content: '667',
        _categories: '57',
        lang: {
          en: {
            _title: 'Naturalistic/Archaeological',
            _content: '671',
            _categories: '110'
          },
          it: {
            _title: 'Naturalistico/Archeologico',
            _content: '667',
            _categories: '58'
          }
        },
        color: '#68B42E',
        name: 'Naturalistico\/archeologico',
        image: 'img/itinerari/natura.jpg',
        description: 'Un percorso che attraversa i comuni di Ugento, Salve, Morciano di Leuca, Presicce ed Acquarica del Capo, fino a raggiungere il famoso Parco Naturale Litorale di Ugento.'
      },
      {
        title: 'Falesie',
        _content: '666',
        _categories: '54',
        lang: {
          en: {
            _title: 'Falesie',
            _content: '544',
            _categories: '99'
          },
          it: {
            _title: 'Falesie',
            _content: '666',
            _categories: '54'
          }
        },
        color: '#CC9999',
        name: 'Falesie',
        image: 'img/itinerari/falesie.jpg',
        description: 'Un percorso che si dispiega lungo la costa adriatica del Capo di Leuca, un paesaggio spettacolare dove il mare e la terra quasi si scontrano lungo la linea di costa, alta, rocciosa, costellata di grotte e insenature.'
      }
  ],

  pois: [],

  getRoutes: function (lang, done) {

      var self = this;

      console.log('language: ' + lang);
          
      async.each(self.routes, function (item, callback) {
        if (lang == 'it') {
          item.title = item.lang.it._title;
          item._content = item.lang.it._content;
          item._categories = item.lang.it._categories;
        } else if (lang == 'en') {
          item.title = item.lang.en._title;
          item._content = item.lang.en._content;
          item._categories = item.lang.en._categories;
        };
        callback();
      }, function (err) {
        // console.log('Routes: ' + JSON.stringify(self.routes));
        done(err, self.routes);
      });

    },

  getAllPOI: function (done, options) {
    var self = this;
    var url = this.server.api + this.server._jsonp;

    this._getJSON(url, function (err, data) {

      var _options = {
        _content: 0,
        _category: 0,
        _random: options.random,
        _lat: options.lat,
        _lng: options.lng
      };

      console.log(JSON.stringify(_options));

      self._createPOIData(_options, data, function (err) {
        
        console.log('*** returned data: ' + _.size(data));
        
        var d_sorted;

        // ordinamento per coordinate 
        if (options.lat > 0 && options.lng > 0) {     
          d_sorted = _.sortBy(self.pois, function (item) {
            return self._distance(options.lat, options.lng, item.latitude, item.longitude);
          });
        } else {
          d_sorted = data;
        };

        // limita l'array
        var d_limit = _.first(d_sorted, options.limit);

        console.log('*** returned data: ' + _.size(d_limit));

        // console.log(JSON.stringify(d_limit))

        done(err, d_limit);
      });

    });

  },

  // punti di interesse ordinate per coordinate più vicine
  getPOIs: function (done, options) {
    
    var self = this;

    this.getRoutes(options.lang, function (err, routes) {

         // per tutti gli itinerari
      async.each(routes, function (item, callback) {
        
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

    });

   

  },

  _getJSON: function (url, done) {

    console.log('get data by url : ' + url);

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
      var img_idle = "assets/marker_idle.png";
      var img_sel = "assets/marker_selected.png";

      var im_i = _.find(item.meta, function (item) {
          return item.name = 'icon-file';
      });

      if (typeof im_i !== 'undefined') {
          img_idle = 'img/markers/' + im_i.value;
          img_sel = img_idle;
      };

      var t = '';
      if (item.text != null) {
        t = S(S(item.text).stripTags().s).decodeHTMLEntities().s;
      };

      var img_src = '';
      
      var img_s = _.find(item.meta, function (item) {
        return item.name == 'image0_thumb_small';
      });

      if (typeof img_s !== 'undefined') {
        img_src = img_s.value;
      };

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
          text: t,
          title: item.title,
          markerIcon: img_idle,
          selectedIcon: img_sel,
          imgInfo: img_src,
          linkApp: 'galleuca://poiReal/' + options._content + '/' + options._category + '/' + item.id + '/' + latReal + '/' + lngReal,
          linkAppAPI: 'galleuca://poiAPI/' + item.id + '/' + latReal + '/' + lngReal
      };

      self.pois.push(poiData);

      callback();

    }, function (err) {
      console.log('------------------------');
      // console.log(JSON.stringify(self.pois));
      done(err);
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