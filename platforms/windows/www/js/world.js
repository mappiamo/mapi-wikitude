
// implementation of AR-Experience (aka "World")
var World = {
	// you may request new data from server periodically, however: in this sample data is only requested once
	isRequestingData: false,

	// true once data was fetched
	initiallyLoadedData: false,

	// different POI-Marker assets
	markerDrawable_idle: null,
	markerDrawable_selected: null,
	markerDrawable_directionIndicator: null,

	// list of AR.GeoObjects that are currently shown in the scene / World
	markerList: [],

	// The last selected marker
	currentMarker: null,

	locationUpdateCounter: 0,
	updatePlacemarkDistancesEveryXLocationUpdates: 10,

	// called to inject new POI data
	loadPoisFromJsonData: function loadPoisFromJsonDataFn(poiData) {

		// show radar & set click-listener
		// PoiRadar.show();
		//$('#radarContainer').unbind('click');
		//$("#radarContainer").click(PoiRadar.clickedRadar);

		// empty list of visible markers
		World.markerList = [];

		// start loading marker assets
		World.markerDrawable_idle = new AR.ImageResource("assets/marker_idle.png");
		World.markerDrawable_selected = new AR.ImageResource("assets/marker_selected.png");
		World.markerDrawable_directionIndicator = new AR.ImageResource("assets/indi.png");

		async.each(poiData, function (item, callback) {
			World.markerList.push(new Marker(item));
			callback();
		}, function (err) {
			World.updateDistanceToUserValues();
			World.updateStatusMessage(_.size(poiData) + ' places loaded. ', false);
		});

	},

	// sets/updates distances of all makers so they are available way faster than calling (time-consuming) distanceToUser() method all the time
	updateDistanceToUserValues: function updateDistanceToUserValuesFn() {
		for (var i = 0; i < World.markerList.length; i++) {
			World.markerList[i].distanceToUser = World.markerList[i].markerObject.locations[0].distanceToUser();
		}
	},

	// updates status message shon in small "i"-button aligned bottom center
	updateStatusMessage: function updateStatusMessageFn(message, isWarning) {

		var themeToUse = isWarning ? "e" : "c";
		var iconToUse = isWarning ? "alert" : "info";

		$("#status-message").html(message);
		$("#popupInfoButton").buttonMarkup({
			theme: themeToUse
		});
		$("#popupInfoButton").buttonMarkup({
			icon: iconToUse
		});
	},

	// location updates, fired every time you call architectView.setLocation() in native environment
	locationChanged: function locationChangedFn(lat, lon, alt, acc) {

		World.requestDataFromServer(lat, lon);

		// request data if not already present
		if (!World.initiallyLoadedData) {
			// World.requestDataFromServer(lat, lon);
			World.initiallyLoadedData = true;
		} else if (World.locationUpdateCounter === 0) {
			// update placemark distance information frequently, you max also update distances only every 10m with some more effort
			World.updateDistanceToUserValues();
		}

		// helper used to update placemark information every now and then (e.g. every 10 location upadtes fired)
		World.locationUpdateCounter = (++World.locationUpdateCounter % World.updatePlacemarkDistancesEveryXLocationUpdates);
	},

	// fired when user pressed maker in cam
	onMarkerSelected: function onMarkerSelectedFn(marker) {
		
		World.currentMarker = marker;

		var description = marker.poiData.description +
						  '<br /><img src="' + marker.poiData.markerIcon + '" />'	

		$("#poi-detail-title").html(marker.poiData.title);
		$("#poi-detail-description").html(description);

		if (marker.poiData.imgInfo != '') {
			$('#image_poi').attr('src', marker.poiData.imgInfo);
		};

		if ($('#focusFlip').val() == 'off') {
			var distance_text = 'Distance: ';
			if ($('#focusLang').val() == 'it') {
				distance_text = 'Distanza: ';
			};
			distance_text += (marker.distanceToUser > 999) ? ((marker.distanceToUser / 1000).toFixed(2) + " km") : (Math.round(marker.distanceToUser) + " m");
			$("#distance_view").html(distance_text);
		};

		$("#poi-detail-link").html('<a href="' + marker.poiData.linkApp + '" target="_blank" data-role="button" data-icon="info" data-theme="a"><img src="img/logo-gal-small.png"></img></a>');
		$("#poi-detail-text").html(marker.poiData.text);

		// show panel
		$("#panel-poidetail").panel("open", 123);
		
		$( ".ui-panel-dismiss" ).unbind("mousedown");

		$("#panel-poidetail").on("panelbeforeclose", function(event, ui) {
			World.currentMarker.setDeselected(World.currentMarker);
		});
		
	},

	// screen was clicked but no geo-object was hit
	onScreenClick: function onScreenClickFn() {
		// you may handle clicks on empty AR space too
	},

	// returns distance in meters of placemark with maxdistance * 1.1
	getMaxDistance: function getMaxDistanceFn() {

		// sort palces by distance so the first entry is the one with the maximum distance
		World.markerList.sort(World.sortByDistanceSortingDescending);

		// use distanceToUser to get max-distance
		var maxDistanceMeters = World.markerList[0].distanceToUser;

		// return maximum distance times some factor >1.0 so ther is some room left and small movements of user don't cause places far away to disappear
		return maxDistanceMeters * 1.1;
	},

	// request POI data
	requestDataFromServer: function requestDataFromServerFn(lat, lon) {

		// set helper var to avoid requesting places while loading
		World.isRequestingData = true;
		World.updateStatusMessage('Requesting places from web-service', true);

		var random = $('#focusFlip').val() == 'off';
		var lang = $('#focusLang').val();
		// var random = true;

		var options = {
			limit: 10,
			random: random,
			lat: lat,
			lng: lon,
			lang: lang
		};

		console.log(JSON.stringify(options));

		Gal.getPOIs(function (err, pois) {

			if (!err) {
				World.updateStatusMessage('Data downloaded successfully!', true);
				World.loadPoisFromJsonData(pois);
				World.isRequestingData = true;	
			} else {
				World.updateStatusMessage("Invalid web-service response.", true);
				World.isRequestingData = false;
			};

		}, options);

	},

	// helper to sort places by distance
	sortByDistanceSorting: function(a, b) {
		return a.distanceToUser - b.distanceToUser;
	},

	// helper to sort places by distance, descending
	sortByDistanceSortingDescending: function(a, b) {
		return b.distanceToUser - a.distanceToUser;
	}
};

AR.context.onLocationChanged = World.locationChanged;
AR.context.onScreenClick = World.onScreenClick;
