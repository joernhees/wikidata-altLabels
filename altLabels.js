/**********************************************************************************
***********************************************************************************
**                         ____  __          __         __                       **
**                  ____ _/ / /_/ /   ____ _/ /_  ___  / /____                   **
**                 / __ `/ / __/ /   / __ `/ __ \/ _ \/ / ___/                   **
**                / /_/ / / /_/ /___/ /_/ / /_/ /  __/ (__  )                    **
**                \__,_/_/\__/_____/\__,_/_.___/\___/_/____/  v3.0.0-dev         **
**                                                                               **
** ----------------------------------------------------------------------------- **
**  How To use:                                                                  **
**   Add the following to your common.js [[Special:MyPage/common.js]]:           **
**   importScript( 'User:Joern/altLabels.js' );                                  **
**                                                                               **
**  Links:                                                                       **
**    [[User:Joern/altLabels.js]]                                                **
**    [[https://github.com/joernhees/wikidata-altLabels]]                        **
**                                                                               **
**  About:                                                                       **
**    This tool will add the 3 most common labels used in other languages below  **
**    the label's edit box in your language. A simple click will approve the     **
**    selected label for the current item.                                       **
**    If the item already has a label in your language nothing is changed.       **
**    This is expecially helpful for names of places or people which are similar **
**    in many languages.                                                         **
**    A useful resource might be this page which lists top items without labels: **
**    [[http://tools.wmflabs.org/wikidata-terminator/?list&lang=de&mode=t1000]]  **
**                                                                               **
**  Bug Reports, Feature Requests, Development:                                  **
**    If you want to report a bug or even have a pull request, please visit      **
**    https://github.com/joernhees/wikidata-altLabels .                          **
**    For testing purposes you can also run the latest development version       **
**    directly from github (see above link).                                     **
**                                                                               **
**  Thanks to:                                                                   **
**    [[User:Jitrixis]] your [[User:Jitrixis/labelLister.js]] helped me a lot.   **
***********************************************************************************
**********************************************************************************/

( function ( mw, $ ) {
	'use strict';

	console.log('altLabels 3.0.0-dev loaded');

	/**
	 * Check if we're viewing an item
	 */
	var itemId = mw.config.get( 'wbEntityId' );
	if ( !itemId ) {
		return;
	}

	/**
	 * holds the DOM input element for the label
	 */
	var labelInput;
	var altLabelsParent;
	var userLanguage;

	/**
	 * altLabels
	 */
	function altLabels() {
		/**
		 * Check for the label input box, its presence means we don't have a label
		 * If we have a label return, do nothing.
		 */
		labelInput = $('h1.firstHeading .wikibase-title.wb-empty');
		if (labelInput.length < 1) {
			return;
		}

		/**
		 * Element into which to add the altLabels
		 */
		altLabelsParent = $('#wb-item-' + itemId + ' div.wikibase-entitytermsview-heading');
		if (altLabelsParent.length < 1) {
			return;
		}


		/**
		 * get user's main language
		 */
		userLanguage = mw.config.get( 'wgUserLanguage' );
		if (userLanguage.length < 1) {
			return;
		}

		/**
		 * load json module
		 */
		mw.loader.load('json');

		/**
		 * get other labels
		 */
		var labels = JSON.parse(mw.config.get('wbEntity')).labels;

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
		var altLabelsDOM = $('<div class="wikibase-entitytermsview-heading-aliases">Approve label from other languages: </div>');
		var altLabelsUL = $('<ul class="wikibase-entitytermsview-aliases"></ul>');
		for (var i = 0; i < Math.min(topLabels.length, 3); i++) {
			label = topLabels[i][0];
			var insertElem = '<li class="wikibase-entitytermsview-aliases-alias"> ' +
				'<a class="wb-item-altlabel" href="" title="Approve this label for my language">'+
				label +
				'</a> <span title="'+labelLangs[label]+'">('+topLabels[i][1]+'x)</span></li>';
			altLabelsUL.append(insertElem);
		}
		altLabelsDOM.append(altLabelsUL);
		// bind click handler to shown altlabels
		altLabelsDOM.find('.wb-item-altlabel').click(submitAltLabel);
		altLabelsParent.prepend(altLabelsDOM);
	}

	/**
	 * submit clicked alt label
	 */
	function submitAltLabel(ev) {
		ev.preventDefault();
		var selectedLabel = $(ev.target).text();
		console.log("selected alt label: " + selectedLabel);

		/*
		 * the value in the following is really set via UI and submitted... can
		 * probably be improved and be done by API directly, but i didn't want
		 * to break anything
		 */
		var labels = {};
		labels[userLanguage] = {
			"language": userLanguage,
			"value": selectedLabel
		};
		setItem(JSON.stringify( {
			"labels": labels,
		} ), "["+userLanguage+"] " + selectedLabel + " (approved from other language)");
	}

	/**
	 * Send the input value on the edit menu
	 */
	function setItem( item, summary ) {
		$.ajax( {
			type: 'POST',
			url: mw.util.wikiScript( 'api' ),
			data: {
				format: 'json',
				action: 'wbeditentity',
				id: itemId,
				type: 'item',
				token: mw.user.tokens.get( 'editToken' ),
				data: item,
				summary: '[[User:Joern/altLabels.js|altLabels]] ' + summary,
				exclude: 'pageid|ns|title|lastrevid|touched|sitelinks'
			}
		} )
		.done( function ( data ) {
			if ( data.hasOwnProperty( "error" ) ) {
				mw.notify( 'API Error' + $.toJSON( data ), { title: 'altLabels.js :', tag: 'altLabels' } );
				$( '#green-box' ).empty();
				$( '#red-box' ).empty();
				$( '#red-box' ).append( data.error.info.replace( /\n/g, ' ' ) );
			} else {
				$( '#green-box' ).empty();
				$( '#green-box' ).append( summary );
				mw.notify('sent', { title: 'altLabels.js :', tag: 'altLabels' } );
				window.location.reload(true);
			}
		} )
		.fail( function () {
			mw.notify( 'API Error', { title: 'altLabels.js :', tag: 'altLabels' } );
			$( '#green-box' ).empty();
			$( '#red-box' ).empty();
			$( '#red-box' ).append( "API Error" );
		} );
	}

	$( document ).ready( altLabels );
} ( mediaWiki, jQuery ) );
