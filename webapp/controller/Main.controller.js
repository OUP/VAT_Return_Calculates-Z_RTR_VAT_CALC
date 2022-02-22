sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/core/Fragment",
  ],
  /**
   * @param {typeof sap.ui.core.mvc.Controller} Controller
   */
  function (Controller, JSONModel, Filter, FilterOperator, Fragment) {
    "use strict";

    let _oViewModel = new JSONModel();
    let _oVatCalcModel = new JSONModel();
    let _oView;
    let _oTable;
    let _oTableItemTemplate;
    let _smartFilterBar;

    return Controller.extend("oup.rtr.vatreturncalc.controller.Main", {
      onInit: function () {
        // view
        _oView = this.getView();

        // odata model
        // _oDataModel = this.getOwnerComponent().getModel();

        // Model used to manipulate control states
        const oData = {
          messageType: "None",
          messageText: "Test",
          messageVisible: false,
          action: "Report",
          filterStatus: "",
        };

        // set data to model
        _oViewModel.setData(oData);

        // set view model
        _oView.setModel(_oViewModel, "oViewModel");
        _oView.setModel(_oVatCalcModel, "oVatCalcModel");

        // smart filter bar
        _smartFilterBar = _oView.byId("smartFilterBar");

        // table
        _oTable = this.getView().byId("idVatReturnTable");

        Fragment.load({
          name: "oup.rtr.vatreturncalc.view.fragment.TableItem",
        }).then(function (oTemplate) {
          _oTableItemTemplate = oTemplate;
        });

        // apply content density mode to root view
        _oView.addStyleClass(this.getOwnerComponent().getContentDensityClass());
      },

      onFilterBarInitialized: function () {
        // trigger search with default filters
        _smartFilterBar.fireSearch();
      },

      /**
       * Getter for the resource bundle.
       * @public
       * @returns {sap.ui.model.resource.ResourceModel} the resourceModel of the component
       */
      getResourceBundle: function () {
        return this.getOwnerComponent().getModel("i18n").getResourceBundle();
      },

      onAssignedFiltersChanged: function () {
        if (_smartFilterBar) {
          var sText = _smartFilterBar.retrieveFiltersWithValuesAsText();

          _oViewModel.setProperty("/filterStatus", sText);
        }
      },

      onFilterBarGoPress: function () {
        // trigger request to backend
        var aFilters = this._getFilters();

        // bind aggreation for items with template and filters
        _oTable.bindAggregation("items", {
          path: "/VAT_EXTRACTSet",
          template: _oTableItemTemplate,
          filters: aFilters,
        });
      },

      _getFilters: function () {
        const aFilters = [];

        const fnGetValuesFromControl = (oControl, sProperty) => {
          const sControlName = oControl.getMetadata().getName();
          let oFilter;

          if (
            sControlName === "sap.ui.comp.smartfilterbar.SFBMultiInput" ||
            sControlName === "sap.m.MultiInput" ||
            sControlName === "sap.m.MultiComboBox"
          ) {
            let aTokens;

            // get selected items in multi combobox
            if (sControlName === "sap.m.MultiComboBox") {
              aTokens = oControl.getSelectedItems();
            }
            // get selected tokens in multi input
            else {
              aTokens = oControl.getTokens();
            }

            const iLen = aTokens.length;
            let i = 0;

            if (iLen === 1) {
              oFilter = new Filter(
                sProperty,
                FilterOperator.EQ,
                aTokens[0].getKey()
              );
            } else if (iLen > 1) {
              let aFilterTokens = [];

              for (i; i < iLen; i++) {
                aFilterTokens.push(
                  new Filter(sProperty, FilterOperator.EQ, aTokens[i].getKey())
                );
              }

              // add the multi input tokens to a filter
              oFilter = new Filter({
                filters: aFilterTokens,
                and: false,
              });
            }
          } else if (sControlName === "sap.m.Input") {
            // check if input value available
            if (oControl.getValue()) {
              oFilter = new Filter(
                sProperty,
                FilterOperator.EQ,
                oControl.getValue()
              );
            }
          } else if (
            sControlName === "sap.m.ComboBox" ||
            sControlName === "sap.m.Select"
          ) {
            // check if input value available
            if (oControl.getSelectedKey()) {
              oFilter = new Filter(
                sProperty,
                FilterOperator.EQ,
                oControl.getSelectedKey()
              );
            }
          }

          return oFilter;
        };

        // all filter items
        const aFilterItems = _smartFilterBar.getFilterGroupItems();

        for (let i = 0, iLen = aFilterItems.length; i < iLen; i++) {
          if (aFilterItems[i].getVisibleInFilterBar()) {
            let oControl = sap.ui.getCore().byId(aFilterItems[i]._sControlId);
            let sKey = aFilterItems[i].getName();
            let oFilter = fnGetValuesFromControl(oControl, sKey);

            if (oFilter) {
              aFilters.push(oFilter);
            }
          }
        }

        return aFilters;
      },
    });
  }
);
