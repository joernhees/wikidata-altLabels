
( function ( mw, $ ) {
	'use strict';

	/**
	 * Check if we're viewing an item
	 */
	var itemId = mw.config.get( 'wbEntityId' );
	if ( !itemId ) {
		return;
	}

	/**
	 * altLabels
	 */
	function altLabels() {
		/**
		 * Check for the label input box, its presence means we don't have a label
		 * If we have a label return, do nothing.
		 */
		var labelInput = $('#wb-item-'+itemId+' h1 span span.wb-value input');
		if (labelInput.length < 1) {
			return;
		}

		/**
		 * get user's main language
		 */
		var lang = mw.config.get( 'wgUserLanguage' );

		/**
		 * get other labels
		 */
		var labels = $.parseJSON(mw.config.get('wbEntity')).labels;

		/**
		 * get the most often used label across languages
		 */
		var label;
		var labelLangs = {};
		for (var labelLang in labels) {
			label = labels[labelLang].value;
			if ( ! (label in labelLangs)) {
				labelLangs[label] = [];
			}
			labelLangs[label].push(labelLang);
		}
		var topLabels = [];
		for (label in labelLangs) {
			topLabels.push([label, labelLangs[label].length]);
		}
		if (topLabels.length === 0) {
			// sad, we didn't find any other labels ;(
			return;
		}
		topLabels.sort(function(a,b) {
			// sort by counts desc, labels asc
			var c = [a[1],b[0]];
			var d = [b[1],a[0]];
			return c < d ? 1 : (c > d ? -1 : 0);
		});

		/**
		 * show (up to) top 3 alternative labels
		 */
		var altLabelsDOM = $('<span class="wb-value-row wb-value-supplement">Approve label from other languages: </span>');
		sep = '';
		for (var i = 0; i < Math.min(topLabels.length, 3); i++) {
			label = topLabels[i][0];
			var insertElem = sep+'<span>' +
				'<a class="wb-item-altlabel" href="#" title="Approve this label for my language">'+
				label +
				'</a> <span title="'+labelLangs[label]+'">('+topLabels[i][1]+'x)</span></span>';
			sep = ', ';
			altLabelsDOM.append(insertElem);
		}
		// bind click handler to shown altlabels
		altLabelsDOM.filter('.wb-item-altlabel').click(submitAltLabel);
		labelInput.parent().after(altLabelsDOM);

		//console.log("hi, item: "+itemId);
	}

	/**
	 * submit clicked alt label
	 */
	function submitAltLabel(ev) {
		console.log('hi');
		ev.prevDefault();
		var selectedLabel = $(ev.target).html();
		console.log(selectedLabel);
	}

	$( document ).ready( altLabels );
} ( mediaWiki, jQuery ) );
