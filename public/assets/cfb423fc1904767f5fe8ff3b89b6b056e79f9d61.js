(function () {
	'use strict';

	if ( typeof CCB_DATA === 'undefined' ) {
		return;
	}

	var MONTHS_UK = [ 'Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень', 'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень' ];
	var MONTHS_GENITIVE_UK = [ 'січня', 'лютого', 'березня', 'квітня', 'травня', 'червня', 'липня', 'серпня', 'вересня', 'жовтня', 'листопада', 'грудня' ];
	var DOW_UK = [ 'Нд', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб' ];
	var DOW_FULL_UK = [ 'Неділя', 'Понеділок', 'Вівторок', 'Середа', 'Четвер', 'П\u2019ятниця', 'Субота' ];
	var AVATAR_COLORS = [ '#8a6d3b', '#7d8f69', '#a3684f', '#6d7fa3', '#9b6b8e', '#5f9b8a' ];

	var ICONS = {
		doctor: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="3.4"/><path d="M4.5 20c1.2-3.8 4.2-6 7.5-6s6.3 2.2 7.5 6"/></svg>',
		list: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="5" cy="6.5" r="1"/><circle cx="5" cy="12" r="1"/><circle cx="5" cy="17.5" r="1"/><line x1="9" y1="6.5" x2="20" y2="6.5"/><line x1="9" y1="12" x2="20" y2="12"/><line x1="9" y1="17.5" x2="20" y2="17.5"/></svg>',
		clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8.2"/><path d="M12 7.5V12l3 2"/></svg>'
	};

	function apiGet( path, params ) {
		var url = CCB_DATA.restUrl + path;
		if ( params ) {
			var qs = Object.keys( params )
				.filter( function ( k ) { return params[ k ] !== undefined && params[ k ] !== null && params[ k ] !== ''; } )
				.map( function ( k ) { return encodeURIComponent( k ) + '=' + encodeURIComponent( params[ k ] ); } )
				.join( '&' );
			if ( qs ) {
				url += '?' + qs;
			}
		}
		return fetch( url ).then( function ( r ) {
			return r.json().then( function ( data ) {
				if ( ! r.ok ) {
					throw new Error( data && data.message ? data.message : 'Request failed' );
				}
				return data;
			} );
		} );
	}

	function apiPost( path, body ) {
		return fetch( CCB_DATA.restUrl + path, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify( body )
		} ).then( function ( r ) {
			return r.json().then( function ( data ) {
				if ( ! r.ok ) {
					throw new Error( data && data.message ? data.message : 'Request failed' );
				}
				return data;
			} );
		} );
	}

	function todayISO( offsetDays ) {
		var d = new Date();
		d.setDate( d.getDate() + ( offsetDays || 0 ) );
		return d.toISOString().slice( 0, 10 );
	}

	/** "Субота, 8 Серпня" — для картки "Деталі запису". */
	function formatDateFull( isoDate ) {
		if ( ! isoDate ) return '';
		var d = new Date( isoDate + 'T00:00:00' );
		var dow = DOW_FULL_UK[ d.getDay() ];
		var month = MONTHS_GENITIVE_UK[ d.getMonth() ];
		month = month.charAt( 0 ).toUpperCase() + month.slice( 1 );
		return dow + ', ' + d.getDate() + ' ' + month;
	}

	function el( tag, cls, html ) {
		var e = document.createElement( tag );
		if ( cls ) e.className = cls;
		if ( html !== undefined ) e.innerHTML = html;
		return e;
	}

	function groupSlotsByPeriod( slots ) {
		var groups = { 'ранок': [], 'день': [], 'вечір': [] };
		slots.forEach( function ( s ) {
			var hour = parseInt( s.time.split( ':' )[ 0 ], 10 );
			if ( hour < 12 ) groups[ 'ранок' ].push( s );
			else if ( hour < 18 ) groups[ 'день' ].push( s );
			else groups[ 'вечір' ].push( s );
		} );
		return groups;
	}

	/** "60 хв · 500 грн" / "60 хв", если цены нет. */
	function formatServiceMeta( svc ) {
		var parts = [];
		if ( svc.execution_time ) {
			parts.push( svc.execution_time + ' хв' );
		}
		if ( svc.price !== null && svc.price !== undefined && svc.price !== '' ) {
			parts.push( formatPrice( svc.price ) );
		}
		return parts.join( ' \u00b7 ' );
	}

	function formatPrice( price ) {
		var num = parseFloat( price );
		if ( isNaN( num ) ) return price + ' грн';
		return ( num % 1 === 0 ? num.toFixed( 0 ) : num.toFixed( 2 ) ) + ' грн';
	}

	function colorForId( id ) {
		var str = String( id || '' );
		var hash = 0;
		for ( var i = 0; i < str.length; i++ ) {
			hash = ( hash * 31 + str.charCodeAt( i ) ) % AVATAR_COLORS.length;
		}
		return AVATAR_COLORS[ Math.abs( hash ) % AVATAR_COLORS.length ];
	}

	function renderAvatar( sp ) {
		if ( sp.photo_url ) {
			var img = el( 'img', 'ccb-avatar ccb-avatar-img' );
			img.src = sp.photo_url;
			img.alt = sp.name || '';
			return img;
		}
		var avatar = el( 'div', 'ccb-avatar', ( sp.name || '?' ).trim().charAt( 0 ).toUpperCase() );
		avatar.style.background = colorForId( sp.id );
		return avatar;
	}

	function BookingWidget( root ) {
		this.root = root;
		this.flow = root.dataset.flow || 'client_choice';
		this.allowFlowChoice = ( this.flow === 'client_choice' );
		this.stepsEl = root.querySelector( '.ccb-steps' );
		this.titleEl = root.querySelector( '.ccb-step-title' );
		this.pendingQuickPick = null;
		this.state = {
			specialist: null,
			service: null,
			date: null,
			time: null,
			cabinetId: null
		};
		this.loadStart();
	}

	BookingWidget.prototype.setTitle = function ( text ) {
		if ( this.titleEl ) {
			this.titleEl.textContent = text;
		}
	};

	BookingWidget.prototype.scrollToTop = function () {
		var rect = this.root.getBoundingClientRect();
		if ( rect.top >= -4 ) {
			return;
		}
		var targetY = window.pageYOffset + rect.top - 16;
		window.scrollTo( { top: Math.max( targetY, 0 ), behavior: 'smooth' } );
	};

	BookingWidget.prototype.renderStep = function ( buildFn ) {
		this.stepsEl.classList.add( 'ccb-step-out' );
		this.stepsEl.innerHTML = '';
		buildFn();
		void this.stepsEl.offsetWidth;
		this.stepsEl.classList.remove( 'ccb-step-out' );
	};

	BookingWidget.prototype.setLoading = function () {
		this.scrollToTop();
		this.stepsEl.innerHTML = '';
		this.stepsEl.appendChild( el( 'div', 'ccb-loading', '<span class="ccb-spinner"></span>' + CCB_DATA.i18n.loading ) );
	};

	BookingWidget.prototype.showError = function ( msg ) {
		var err = el( 'div', 'ccb-error', msg );
		this.stepsEl.insertBefore( err, this.stepsEl.firstChild );
	};

	BookingWidget.prototype.showLoadError = function ( error, retryFn ) {
		if ( window.console && console.error ) {
			console.error( error );
		}
		this.stepsEl.innerHTML = '';
		this.stepsEl.appendChild( el( 'div', 'ccb-error', 'Не вдалося завантажити дані. Перевірте з\u2019єднання та спробуйте ще раз.' ) );
		var retryBtn = el( 'button', 'ccb-btn-primary ccb-retry-btn', 'Спробувати ще раз' );
		retryBtn.type = 'button';
		retryBtn.addEventListener( 'click', retryFn );
		this.stepsEl.appendChild( retryBtn );
	};

	BookingWidget.prototype.loadStart = function () {
		if ( this.flow === 'specialist_first' ) {
			this.renderSpecialistList();
		} else if ( this.flow === 'service_first' ) {
			this.renderServiceList();
		} else {
			this.renderFlowChoice();
		}
	};

	BookingWidget.prototype.renderFlowChoice = function () {
		var self = this;
		self.setTitle( 'Як бажаєте записатись?' );
		self.scrollToTop();

		self.renderStep( function () {
			var bySpecialist = el( 'div', 'ccb-list-row ccb-choice-row' );
			bySpecialist.appendChild( el( 'div', 'ccb-choice-icon', ICONS.doctor ) );
			var info1 = el( 'div' );
			info1.appendChild( el( 'div', 'ccb-name', 'За спеціалістом' ) );
			info1.appendChild( el( 'div', 'ccb-meta', 'Спочатку оберіть лікаря' ) );
			bySpecialist.appendChild( info1 );
			bySpecialist.addEventListener( 'click', function () {
				self.flow = 'specialist_first';
				self.renderSpecialistList();
			} );

			var byService = el( 'div', 'ccb-list-row ccb-choice-row' );
			byService.appendChild( el( 'div', 'ccb-choice-icon', ICONS.list ) );
			var info2 = el( 'div' );
			info2.appendChild( el( 'div', 'ccb-name', 'За послугою' ) );
			info2.appendChild( el( 'div', 'ccb-meta', 'Спочатку оберіть послугу' ) );
			byService.appendChild( info2 );
			byService.addEventListener( 'click', function () {
				self.flow = 'service_first';
				self.renderServiceList();
			} );

			self.stepsEl.appendChild( bySpecialist );
			self.stepsEl.appendChild( byService );
		} );
	};

	BookingWidget.prototype.renderSpecialistList = function () {
		var self = this;
		self.setTitle( CCB_DATA.i18n.choose_specialist );
		self.setLoading();

		apiGet( '/specialists' ).then( function ( list ) {
			self.renderStep( function () {
				if ( self.allowFlowChoice ) {
					self.stepsEl.appendChild( self.backLink( function () { self.renderFlowChoice(); } ) );
				}

				if ( ! list || ! list.length ) {
					self.stepsEl.appendChild( el( 'div', 'ccb-error', CCB_DATA.i18n.no_slots ) );
					return;
				}

				list.forEach( function ( sp ) {
					self.stepsEl.appendChild( self.buildSpecialistRow( sp ) );
				} );
			} );
		} ).catch( function ( e ) {
			self.showLoadError( e, function () { self.renderSpecialistList(); } );
		} );
	};

	BookingWidget.prototype.buildSpecialistRow = function ( sp ) {
		var self = this;
		var row = el( 'div', 'ccb-list-row ccb-specialist-row' );
		var top = el( 'div', 'ccb-specialist-top' );
		top.appendChild( renderAvatar( sp ) );

		var info = el( 'div' );
		info.appendChild( el( 'div', 'ccb-name', sp.name || '' ) );
		if ( sp.nearest_label ) {
			info.appendChild( el( 'div', 'ccb-meta', 'Найближчий час для запису: ' + sp.nearest_label ) );
		}
		top.appendChild( info );
		top.addEventListener( 'click', function () {
			self.state.specialist = sp;
			self.pendingQuickPick = null;
			self.renderServiceList( sp.id );
		} );
		row.appendChild( top );

		if ( sp.quick_slots && sp.quick_slots.length ) {
			var chips = el( 'div', 'ccb-quick-chips' );
			sp.quick_slots.forEach( function ( slot ) {
				var chip = el( 'button', 'ccb-chip', slot.time );
				chip.type = 'button';
				chip.addEventListener( 'click', function ( ev ) {
					ev.stopPropagation();
					self.state.specialist = sp;
					self.pendingQuickPick = { date: sp.nearest_date, time: slot.time, cabinetId: slot.cabinet_id };
					self.renderServiceList( sp.id );
				} );
				chips.appendChild( chip );
			} );
			var otherChip = el( 'button', 'ccb-chip ccb-chip-muted', 'Інший час' );
			otherChip.type = 'button';
			otherChip.addEventListener( 'click', function ( ev ) {
				ev.stopPropagation();
				self.state.specialist = sp;
				self.pendingQuickPick = null;
				self.renderServiceList( sp.id );
			} );
			chips.appendChild( otherChip );
			row.appendChild( chips );
		}

		return row;
	};

	BookingWidget.prototype.renderServiceList = function ( specialistId ) {
		var self = this;
		self.setTitle( CCB_DATA.i18n.choose_service );
		self.setLoading();

		var params = { specialist_id: specialistId };
		if ( specialistId && self.pendingQuickPick ) {
			params.date = self.pendingQuickPick.date;
			params.time = self.pendingQuickPick.time;
		}

		apiGet( '/services', params ).then( function ( list ) {
			list = ( list || [] ).slice().sort( function ( a, b ) {
				return ( a.available === false ? 1 : 0 ) - ( b.available === false ? 1 : 0 );
			} );
			self.renderStep( function () {
				if ( specialistId ) {
					self.stepsEl.appendChild( self.backLink( function () { self.pendingQuickPick = null; self.renderSpecialistList(); } ) );
				} else if ( self.allowFlowChoice ) {
					self.stepsEl.appendChild( self.backLink( function () { self.renderFlowChoice(); } ) );
				}

				var searchInput = el( 'input', 'ccb-search-input' );
				searchInput.type = 'text';
				searchInput.placeholder = CCB_DATA.i18n.search_placeholder || 'Пошук...';
				self.stepsEl.appendChild( searchInput );

				var listEl = el( 'div', 'ccb-service-list' );
				self.stepsEl.appendChild( listEl );

				var noResults = el( 'div', 'ccb-meta ccb-no-results', 'Нічого не знайдено' );
				noResults.style.display = 'none';
				self.stepsEl.appendChild( noResults );

				var rows = [];

				( list || [] ).forEach( function ( svc ) {
					var isUnavailable = svc.available === false;
					var row = el( 'div', 'ccb-list-row' + ( isUnavailable ? ' is-disabled' : '' ) );
					var info = el( 'div' );
					info.appendChild( el( 'div', 'ccb-name', svc.name || '' ) );
					if ( isUnavailable ) {
						info.appendChild( el( 'div', 'ccb-meta', 'Виконавець недоступний або бракує часу' ) );
					} else {
						var meta = formatServiceMeta( svc );
						if ( meta ) {
							info.appendChild( el( 'div', 'ccb-meta', meta ) );
						}
					}
					row.appendChild( info );

					if ( ! isUnavailable ) {
						row.addEventListener( 'click', function () {
							self.state.service = svc;
							if ( self.pendingQuickPick ) {
								self.tryConfirmPending();
							} else if ( self.flow === 'service_first' && ! self.state.specialist ) {
								self.renderSpecialistListForService( svc.id );
							} else {
								self.renderCalendar();
							}
						} );
					}
					listEl.appendChild( row );
					rows.push( { el: row, name: ( svc.name || '' ).toLowerCase() } );
				} );

				searchInput.addEventListener( 'input', function () {
					var query = searchInput.value.trim().toLowerCase();
					var visibleCount = 0;
					rows.forEach( function ( r ) {
						var match = ! query || r.name.indexOf( query ) !== -1;
						r.el.style.display = match ? '' : 'none';
						if ( match ) visibleCount++;
					} );
					noResults.style.display = visibleCount ? 'none' : 'block';
				} );
			} );
		} ).catch( function ( e ) {
			self.showLoadError( e, function () { self.renderServiceList( specialistId ); } );
		} );
	};

	BookingWidget.prototype.renderSpecialistListForService = function ( serviceId ) {
		var self = this;
		self.setTitle( CCB_DATA.i18n.choose_specialist );
		self.setLoading();

		apiGet( '/specialists', { service_id: serviceId } ).then( function ( list ) {
			self.renderStep( function () {
				self.stepsEl.appendChild( self.backLink( function () { self.renderServiceList(); } ) );

				if ( ! list || ! list.length ) {
					self.stepsEl.appendChild( el( 'div', 'ccb-error', CCB_DATA.i18n.no_slots ) );
					return;
				}

				list.forEach( function ( sp ) {
					var row = self.buildSpecialistRow( sp );
					self.stepsEl.appendChild( row );
				} );
			} );
		} ).catch( function ( e ) {
			self.showLoadError( e, function () { self.renderSpecialistListForService( serviceId ); } );
		} );
	};

	BookingWidget.prototype.tryConfirmPending = function () {
		var self = this;
		var pending = self.pendingQuickPick;
		self.pendingQuickPick = null;

		self.setTitle( 'Перевіряємо час...' );
		self.setLoading();

		apiGet( '/slots', {
			specialist_id: self.state.specialist.id,
			service_id: self.state.service.id,
			date_from: pending.date,
			date_to: pending.date
		} ).then( function ( data ) {
			var daySlots = ( data && data[ pending.date ] ) || [];
			var match = null;
			daySlots.forEach( function ( s ) {
				if ( s.time === pending.time ) match = s;
			} );

			if ( match ) {
				self.state.date = pending.date;
				self.state.time = match.time;
				self.state.cabinetId = match.cabinet_id;
				self.renderContactForm();
			} else {
				self.renderCalendar( pending.date );
			}
		} ).catch( function () {
			self.renderCalendar( pending.date );
		} );
	};

	BookingWidget.prototype.renderCalendar = function ( preferredDate ) {
		var self = this;
		self.setTitle( 'Оберіть дату і час' );
		self.setLoading();

		var dateFrom = todayISO( 0 );
		var dateTo = todayISO( 60 );

		apiGet( '/slots', {
			specialist_id: self.state.specialist.id,
			service_id: self.state.service.id,
			date_from: dateFrom,
			date_to: dateTo
		} ).then( function ( data ) {
			self.slotsData = data || {};
			self.availableDates = Object.keys( self.slotsData ).sort();

			self.renderStep( function () {
				self.stepsEl.appendChild( self.backLink( function () {
					if ( self.flow === 'service_first' ) {
						self.renderSpecialistListForService( self.state.service.id );
					} else {
						self.renderServiceList( self.state.specialist.id );
					}
				} ) );

				self.calendarWrap = el( 'div' );
				self.stepsEl.appendChild( self.calendarWrap );

				if ( ! self.availableDates.length ) {
					self.calendarWrap.appendChild( el( 'div', 'ccb-error', CCB_DATA.i18n.no_slots ) );
					return;
				}

				self.selectedDate = ( preferredDate && self.availableDates.indexOf( preferredDate ) !== -1 )
					? preferredDate
					: self.availableDates[ 0 ];
				self.renderCalendarBody();
			} );
		} ).catch( function ( e ) {
			self.showLoadError( e, function () { self.renderCalendar( preferredDate ); } );
		} );
	};

	BookingWidget.prototype.renderCalendarBody = function () {
		var self = this;
		self.calendarWrap.innerHTML = '';

		var monthsSeen = [];
		self.availableDates.forEach( function ( d ) {
			var m = d.slice( 0, 7 ); // YYYY-MM
			if ( monthsSeen.indexOf( m ) === -1 ) monthsSeen.push( m );
		} );

		var selectedMonth = self.selectedDate.slice( 0, 7 );

		var tabs = el( 'div', 'ccb-tabs' );
		monthsSeen.forEach( function ( m ) {
			var monthIdx = parseInt( m.split( '-' )[ 1 ], 10 ) - 1;
			var btn = el( 'button', 'ccb-tab' + ( m === selectedMonth ? ' is-active' : '' ), MONTHS_UK[ monthIdx ] );
			btn.type = 'button';
			btn.addEventListener( 'click', function () {
				var firstOfMonth = self.availableDates.filter( function ( d ) { return d.slice( 0, 7 ) === m; } )[ 0 ];
				self.selectedDate = firstOfMonth;
				self.renderCalendarBody();
			} );
			tabs.appendChild( btn );
		} );
		self.calendarWrap.appendChild( tabs );

		var days = self.availableDates.filter( function ( d ) { return d.slice( 0, 7 ) === selectedMonth; } );
		var daysWrap = el( 'div', 'ccb-days-scroller' );
		days.forEach( function ( d ) {
			var dayNum = d.slice( 8, 10 );
			var dow = DOW_UK[ new Date( d + 'T00:00:00' ).getDay() ];
			var btn = el( 'button', 'ccb-day' + ( d === self.selectedDate ? ' is-active' : '' ), '<span class="ccb-dow">' + dow + '</span>' + dayNum );
			btn.type = 'button';
			btn.addEventListener( 'click', function () {
				self.selectedDate = d;
				self.renderCalendarBody();
			} );
			daysWrap.appendChild( btn );
		} );
		self.calendarWrap.appendChild( daysWrap );

		var slotsForDay = self.slotsData[ self.selectedDate ] || [];
		var groups = groupSlotsByPeriod( slotsForDay );

		Object.keys( groups ).forEach( function ( label ) {
			if ( ! groups[ label ].length ) return;
			var groupEl = el( 'div', 'ccb-slot-group' );
			groupEl.appendChild( el( 'div', 'ccb-slot-group-title', label ) );
			var grid = el( 'div', 'ccb-slot-grid' );
			groups[ label ].forEach( function ( slot ) {
				var btn = el( 'button', 'ccb-slot-btn', slot.time );
				btn.type = 'button';
				btn.addEventListener( 'click', function () {
					self.state.date = self.selectedDate;
					self.state.time = slot.time;
					self.state.cabinetId = slot.cabinet_id;
					self.renderContactForm();
				} );
				grid.appendChild( btn );
			} );
			groupEl.appendChild( grid );
			self.calendarWrap.appendChild( groupEl );
		} );
	};

	BookingWidget.prototype.renderContactForm = function () {
		var self = this;
		self.setTitle( 'Ваші дані' );
		self.scrollToTop();

		self.renderStep( function () {
			self.stepsEl.appendChild( self.backLink( function () { self.renderCalendar( self.state.date ); } ) );

			var price = self.state.service && self.state.service.price !== null && self.state.service.price !== undefined && self.state.service.price !== ''
				? formatPrice( self.state.service.price )
				: 'уточнюється';
			var duration = self.state.service && self.state.service.execution_time ? self.state.service.execution_time + ' хв.' : '';

			var details = el( 'div', 'ccb-card' );
			details.appendChild( el( 'div', 'ccb-card-heading ccb-details-title', 'Деталі запису' ) );

			var rowSpecialist = el( 'div', 'ccb-detail-row' );
			rowSpecialist.appendChild( el( 'div', 'ccb-detail-icon', ICONS.doctor ) );
			var bodySpecialist = el( 'div', 'ccb-detail-body' );
			bodySpecialist.appendChild( el( 'div', 'ccb-detail-main', '<strong>' + ( self.state.specialist ? self.state.specialist.name : '' ) + '</strong>' ) );
			rowSpecialist.appendChild( bodySpecialist );
			details.appendChild( rowSpecialist );

			var rowDate = el( 'div', 'ccb-detail-row' );
			rowDate.appendChild( el( 'div', 'ccb-detail-icon', ICONS.clock ) );
			var bodyDate = el( 'div', 'ccb-detail-body' );
			bodyDate.appendChild( el( 'div', 'ccb-detail-main', '<strong>' + formatDateFull( self.state.date ) + ', ' + self.state.time + '</strong>' ) );
			rowDate.appendChild( bodyDate );
			details.appendChild( rowDate );

			var rowServices = el( 'div', 'ccb-detail-row' );
			rowServices.appendChild( el( 'div', 'ccb-detail-icon', ICONS.list ) );
			var bodyServices = el( 'div', 'ccb-detail-body' );

			var servicesHead = el( 'div', 'ccb-detail-main' );
			servicesHead.appendChild( el( 'span', '', 'Послуги' ) );
			servicesHead.appendChild( el( 'strong', '', duration ) );
			bodyServices.appendChild( servicesHead );

			var line = el( 'div', 'ccb-service-line' );
			var lineLeft = el( 'div' );
			lineLeft.appendChild( el( 'div', 'ccb-service-line-name', self.state.service ? self.state.service.name : '' ) );
			if ( duration ) {
				lineLeft.appendChild( el( 'div', 'ccb-service-line-duration', duration ) );
			}
			line.appendChild( lineLeft );
			line.appendChild( el( 'div', 'ccb-service-line-price', price ) );
			bodyServices.appendChild( line );

			var total = el( 'div', 'ccb-service-total' );
			total.appendChild( el( 'span', '', 'Всього' ) );
			total.appendChild( el( 'span', '', price ) );
			bodyServices.appendChild( total );

			rowServices.appendChild( bodyServices );
			details.appendChild( rowServices );

			self.stepsEl.appendChild( details );

			var form = el( 'div', 'ccb-card' );
			form.appendChild( el( 'div', 'ccb-card-heading', 'Ваші контакти' ) );

			var firstNameRow = el( 'div', 'ccb-form-row', '<label>Ім\'я *</label>' );
			var firstNameInput = el( 'input' );
			firstNameInput.type = 'text';
			firstNameInput.required = true;
			firstNameRow.appendChild( firstNameInput );

			var lastNameRow = el( 'div', 'ccb-form-row', '<label>Прізвище *</label>' );
			var lastNameInput = el( 'input' );
			lastNameInput.type = 'text';
			lastNameInput.required = true;
			lastNameRow.appendChild( lastNameInput );

			var phoneRow = el( 'div', 'ccb-form-row', '<label>Телефон *</label>' );
			var phoneInput = el( 'input' );
			phoneInput.type = 'tel';
			phoneInput.placeholder = '+380';
			phoneInput.required = true;
			phoneRow.appendChild( phoneInput );

			var commentRow = el( 'div', 'ccb-form-row', '<label>Коментар</label>' );
			var commentInput = el( 'textarea' );
			commentInput.rows = 2;
			commentRow.appendChild( commentInput );

			form.appendChild( firstNameRow );
			form.appendChild( lastNameRow );
			form.appendChild( phoneRow );
			form.appendChild( commentRow );
			self.stepsEl.appendChild( form );

			var submitBtn = el( 'button', 'ccb-btn-primary', CCB_DATA.i18n.submit || 'Зробити запис' );
			submitBtn.type = 'button';
			submitBtn.addEventListener( 'click', function () {
				submitBtn.disabled = true;
				submitBtn.classList.add( 'is-loading' );
				apiPost( '/book', {
					specialist_id: self.state.specialist.id,
					service_id: self.state.service.id,
					cabinet_id: self.state.cabinetId,
					date: self.state.date,
					time: self.state.time,
					patient_firstname: firstNameInput.value,
					patient_lastname: lastNameInput.value,
					patient_phone: phoneInput.value,
					comment: commentInput.value
				} ).then( function ( res ) {
					window.location.href = res.redirect_url || '/';
				} ).catch( function ( e ) {
					submitBtn.disabled = false;
					submitBtn.classList.remove( 'is-loading' );
					self.showError( e.message || CCB_DATA.i18n.submit_error );
				} );
			} );
			self.stepsEl.appendChild( submitBtn );
		} );
	};

	BookingWidget.prototype.backLink = function ( onClick ) {
		var link = el( 'div', 'ccb-back-link', '\u2190 Назад' );
		link.addEventListener( 'click', onClick );
		return link;
	};

	document.addEventListener( 'DOMContentLoaded', function () {
		document.querySelectorAll( '.ccb-widget' ).forEach( function ( root ) {
			new BookingWidget( root );
		} );
	} );
})();
