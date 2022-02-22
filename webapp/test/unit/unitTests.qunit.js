/* global QUnit */
QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function () {
	"use strict";

	sap.ui.require([
		"ouprtr./vat_return_calc/test/unit/AllTests"
	], function () {
		QUnit.start();
	});
});
