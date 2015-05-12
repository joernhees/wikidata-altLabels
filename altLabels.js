/**********************************************************************************
***********************************************************************************
**                         ____  __          __         __                       **
**                  ____ _/ / /_/ /   ____ _/ /_  ___  / /____                   **
**                 / __ `/ / __/ /   / __ `/ __ \/ _ \/ / ___/                   **
**                / /_/ / / /_/ /___/ /_/ / /_/ /  __/ (__  )                    **
**                \__,_/_/\__/_____/\__,_/_.___/\___/_/____/  v2.0.0-dev         **
**                                                                               **
** ----------------------------------------------------------------------------- **
**  How To use:                                                                  **
**   Add to your common.js [[Special:MyPage/common.js]],                         **
**   importScript( 'User:Joern/altLabels.js' );                                  **
**                                                                               **
**  Links:                                                                       **
**    [[User:Joern/altLabels.js]]                                                **
**                                                                               **
**  About:                                                                       **
**    This tool will add the 3 most common labels used in other languages below  **
**    the label's edit box in your language. A simple click will approve the     **
**    selected label for the current item.                                       **
**    If the item already has a label in your language nothing is changed.       **
**                                                                               **
**  Thanks to:                                                                   **
**    [[User:Jitrixis]] your [[User:Jitrixis/labelLister.js]] helped me a lot.   **
***********************************************************************************
**********************************************************************************/

( function ( mw, $ ) {
	'use strict';

	console.log('altLabels 2.0.0-dev loaded');

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
	var userLanguage;

	/**
	 * altLabels
	 */
	function altLabels() {
		/**
		 * Check for the label input box, its presence means we don't have a label
		 * If we have a label return, do nothing.
		 */
		labelInput = $('#wb-item-'+itemId+' h1.wikibase-entitytermsview-heading-label.wb-empty');
		if (labelInput.length < 1) {
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
		var altLabelsDOM = $('<span class="wb-value-row wb-value-supplement">Approve label from other languages: </span>');
		var sep = '';
		for (var i = 0; i < Math.min(topLabels.length, 3); i++) {
			label = topLabels[i][0];
			var insertElem = sep+'<span>' +
				'<a class="wb-item-altlabel" href="" title="Approve this label for my language">'+
				label +
				'</a> <span title="'+labelLangs[label]+'">('+topLabels[i][1]+'x)</span></span>';
			sep = ', ';
			altLabelsDOM.append(insertElem);
		}
		// bind click handler to shown altlabels
		altLabelsDOM.find('.wb-item-altlabel').click(submitAltLabel);
		labelInput.after(altLabelsDOM);
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
