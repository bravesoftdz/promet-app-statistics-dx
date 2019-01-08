﻿rtl.module("statistics",["System","JS","Web","Classes","Avamm","webrouter","AvammForms","dhtmlx_base","dhtmlx_form","SysUtils","Types","dhtmlx_toolbar","dhtmlx_grid"],function () {
  "use strict";
  var $mod = this;
  rtl.createClass($mod,"TStatisticsForm",pas.AvammForms.TAvammForm,function () {
    this.$init = function () {
      pas.AvammForms.TAvammForm.$init.call(this);
      this.ContentLoadedEvent = 0;
      this.ContToolbar = null;
      this.FPdf = undefined;
      this.aFrame = null;
      this.Grid = null;
      this.ContentForm = null;
    };
    this.$final = function () {
      this.ContToolbar = undefined;
      this.aFrame = undefined;
      this.Grid = undefined;
      this.ContentForm = undefined;
      pas.AvammForms.TAvammForm.$final.call(this);
    };
    this.DoLoadData = function () {
      this.CreateForm();
      pas.AvammForms.TAvammForm.DoLoadData.apply(this,arguments);
      this.DoOpen();
      this.Form.setFocusOnFirstActive();
    };
    this.DoEnterKeyPressed = function () {
      this.DoExecute();
    };
    this.CreateForm = function () {
      var Self = this;
      function ToolbarButtonClick(id) {
        if (id === "execute") {
          Self.DoExecute();
        } else if (id === "rawdata") {
          Self.ShowData();
        };
      };
      Self.Tabs.addTab("content",rtl.getResStr(pas.statistics,"strContent"),100,0,true,false);
      Self.Tabs.cells("content").hide();
      Self.Form.hideItem("eShorttext");
      Self.Form.hideItem("lCommon");
      Self.Tabs.cont.children.item(0).childNodes.item(0).style.setProperty("height","0px");
      Self.Toolbar.addButton("execute",0,rtl.getResStr(pas.statistics,"strExecute"),"fa fa-pie-chart","fa fa-pie-chart");
      Self.Toolbar.addButton("rawdata",8,rtl.getResStr(pas.statistics,"strRawData"),"fa fa-table","fa fa-table");
      Self.Form.addItem(null,pas.JS.New(["type","label","label",rtl.getResStr(pas.statistics,"strSettings"),"hidden",true,"name","lSettings"]));
      Self.Toolbar.attachEvent("onClick",ToolbarButtonClick);
      Self.ContentForm = Self.Form;
      Self.ContToolbar = rtl.getObject(Self.Tabs.cells("content").attachToolbar(pas.JS.New(["iconset","awesome"])));
      Self.ContToolbar.addButton("zoom+",null,"","fa fa-search-plus","fa fa-search-plus");
      Self.ContToolbar.addButton("zoom-",null,"","fa fa-search-minus","fa fa-search-minus");
      Self.ContToolbar.disableItem("zoom+");
      Self.ContToolbar.disableItem("zoom-");
      Self.ContToolbar.attachEvent("onClick",rtl.createCallback(Self,"ContToolBarClicked"));
      Self.Tabs.addTab("data",rtl.getResStr(pas.statistics,"strContent"),100,0,true,false);
      Self.Tabs.cells("data").hide();
      Self.Grid = rtl.getObject(Self.Tabs.cells("data").attachGrid(pas.JS.New([])));
    };
    this.DoFormChange = function (Id, value) {
      if (this.ContentForm.getUserData("" + Id,"statistics","n") != "y") pas.AvammForms.TAvammForm.DoFormChange.call(this,Id,value);
    };
    this.ContToolBarClicked = function (id) {
      var aPdf = undefined;
      aPdf = this.FPdf;
      if (id === "zoom+") {
        this.aFrame.scale+=0.1;
        this.aFrame.contdiv.innerHTML = "";
        this.aFrame.currPage = 1;
        this.aFrame.renderPdf(aPdf);
      } else if (id === "zoom-") {
        this.aFrame.scale-=0.1;
        this.aFrame.contdiv.innerHTML = "";
        this.aFrame.currPage = 1;
        this.aFrame.renderPdf(aPdf);
      };
    };
    this.DoOpen = function () {
      var Self = this;
      function CheckRemoveItem(aName) {
        if (Self.ContentForm.getUserData(aName,"statistics","n") == "y") Self.ContentForm.removeItem(aName);
      };
      var aQuerry = "";
      var aRegex = null;
      var aCont = [];
      var HasControls = false;
      var DontExecute = false;
      var aHeight = 0;
      var i = 0;
      var aDiv = null;
      DontExecute = false;
      aQuerry = "" + Self.FData["QUERRY"];
      aRegex = new RegExp("@(.*?):(.*?)@");
      aCont = aRegex.exec(aQuerry);
      HasControls = false;
      Self.ContentForm.forEachItem(CheckRemoveItem);
      aHeight = 70;
      i = 0;
      while (i < rtl.length(aCont)) {
        i += 1;
        Self.ContentForm.addItem(null,pas.JS.New(["type","input","name",aCont[i],"label",aCont[i],"value","*"]));
        if (Self.FParams.GetValue(aCont[i]) !== "") {
          Self.ContentForm.setItemValue(aCont[i],Self.FParams.GetValue(aCont[i]))}
         else DontExecute = true;
        Self.ContentForm.setUserData(aCont[i],"statistics","y");
        HasControls = true;
        i += 2;
        aHeight = aHeight + 70;
      };
      if (HasControls) {
        Self.ContentForm.showItem("lSettings")}
       else Self.ContentForm.hideItem("lSettings");
      Self.DoSetFormSize();
      Self.Tabs.cells("history").hide();
      if (Self.FData["DESCRIPTION"] != null) {
        Self.Tabs.addTab("description",rtl.getResStr(pas.AvammForms,"strDescription"),null,1,false,false);
        aDiv = document.createElement("div");
        Self.Tabs.cells("description").appendObject(aDiv);
        aDiv.innerHTML = "" + Self.FData["DESCRIPTION"];
      };
      if (!DontExecute) Self.DoExecute();
    };
    this.DoExecute = function () {
      var Self = this;
      function DoShowPDF(aValue) {
        var Result = undefined;
        function PDFIsLoaded() {
          var aRequest = null;
          var aPdf = null;
          function SetPDF(aValue) {
            var Result = undefined;
            var elm = null;
            function DoScroll(event) {
              var Result = false;
              var delta = 0;
              var strg = false;
              try {
                //if (event.type == "wheel") supportsWheel = true;
                delta = ((event.deltaY || -event.wheelDelta || event.detail) >> 10) || 1;
                strg = event.ctrlKey;
                if (!strg) return Result;
                if (delta > 0) {
                  Self.ContToolBarClicked("zoom-")}
                 else Self.ContToolBarClicked("zoom+");
                event.preventDefault();
              } catch ($e) {
              };
              Result = false;
              return Result;
            };
            Self.FPdf = aValue;
            Self.ContToolbar.enableItem("zoom+");
            Self.ContToolbar.enableItem("zoom-");
            try {
              elm = Self.aFrame.contdiv;
              elm.addEventListener("DOMMouseScroll",DoScroll);
              elm.addEventListener("wheel",DoScroll);
              elm.addEventListener("mousewheel",DoScroll);
              elm.addEventListener("scroll",DoScroll);
            } catch ($e) {
            };
            return Result;
          };
          function SetPDFo() {
            aPdf.then(SetPDF);
          };
          if (aValue.status !== 200) {
            Self.Layout.progressOff();
            dhtmlx.message(pas.JS.New(["type","error","text",aValue.responseText]));
            Self.ShowData();
            Self.Tabs.cells("content").hide();
          } else {
            Self.aFrame = Self.Tabs.cells("content").getFrame();
            pas.Avamm.InitWindow(Self.aFrame);
            aRequest = aValue;
            Self.Tabs.cells("content").show();
            Self.Tabs.cells("content").setActive();
            Self.Layout.progressOff();
            Self.aFrame = Self.aFrame.contentWindow;
            var reader = new FileReader();
            reader.addEventListener('loadend', function() {
              aPdf = Self.aFrame.loadPdf({data:this.result}).promise;
              aBlob = null;
              reader = null;
            });
            aBlob = null;
            reader.addEventListener("onerror", function (error) {
                  throw error;
                }, false);
            var aBlob = new Blob([aRequest.response], {type: "application/octet-stream"})
            reader.readAsArrayBuffer(aBlob);
            window.setTimeout(SetPDFo,100);
            Self.Tabs.detachEvent(Self.ContentLoadedEvent);
          };
        };
        var $with1 = Self.Tabs.cells("content");
        $with1.attachURL("\/appbase\/pdfview.html");
        pas.Avamm.InitWindow($with1.getFrame());
        Self.ContentLoadedEvent = Self.Tabs.attachEvent("onContentLoaded",PDFIsLoaded);
        return Result;
      };
      function DoLoadPDF(aValue) {
        var Result = undefined;
        var aName = "";
        var aExt = "";
        var aUrl = "";
        var i = 0;
        var ReportLoaded = false;
        function AddParamToUrl(aParam) {
          if (Self.ContentForm.getUserData(aParam,"statistics","n") == "y") aUrl = (((aUrl + "&") + aParam) + "=") + ("" + Self.ContentForm.getItemValue(aParam));
        };
        for (var $l1 = 0, $end2 = Self.Reports.length - 1; $l1 <= $end2; $l1++) {
          i = $l1;
          aName = "" + rtl.getObject(Self.Reports[i])["name"];
          aExt = pas.System.Copy(aName,pas.System.Pos(".",aName) + 1,aName.length);
          aName = pas.System.Copy(aName,0,pas.System.Pos(".",aName) - 1);
          if (aExt === "pdf") {
            aUrl = (((("\/" + Self.FTablename) + "\/by-id\/") + ("" + Self.FID)) + "\/reports\/") + ("" + rtl.getObject(Self.Reports[i])["name"]);
            aUrl = aUrl + "?exec=1";
            Self.ContentForm.forEachItem(AddParamToUrl);
            pas.Avamm.LoadData(aUrl,false,"",15000).then(DoShowPDF);
            ReportLoaded = true;
            return Result;
          };
        };
        if (!ReportLoaded) {
          Self.Layout.progressOff();
          Self.Tabs.cells("content").hide();
          Self.ShowData();
          dhtmlx.message(pas.JS.New(["type","warning","text",rtl.getResStr(pas.statistics,"strNoReport")]));
        };
        return Result;
      };
      Self.Layout.progressOn();
      Self.ReportsLoaded.then(DoLoadPDF);
    };
    this.ShowData = function () {
      var Self = this;
      function DoShowData(aValue) {
        var Result = undefined;
        var aJson = null;
        var aProps = [];
        var tmp = "";
        var i = 0;
        var a = 0;
        var aId = undefined;
        var aArr2 = null;
        Self.Grid.clearAll(true);
        aJson = rtl.getObject(JSON.parse(aValue.responseText));
        Self.Layout.progressOff();
        if (aJson.length === 0) return Result;
        aProps = Object.getOwnPropertyNames(rtl.getObject(aJson[0]));
        for (var $l1 = 1, $end2 = rtl.length(aProps) - 1; $l1 <= $end2; $l1++) {
          i = $l1;
          if (i > 1) {
            tmp = (tmp + ",") + aProps[i]}
           else tmp = aProps[i];
        };
        Self.Grid.setHeader(tmp);
        Self.Grid.setColumnIds(tmp);
        Self.Grid.init();
        for (var $l3 = 0, $end4 = aJson.length - 1; $l3 <= $end4; $l3++) {
          i = $l3;
          aId = (new Date()).valueOf();
          aArr2 = new Array();
          aProps = Object.getOwnPropertyNames(rtl.getObject(aJson[i]));
          for (var $l5 = 1, $end6 = rtl.length(aProps) - 1; $l5 <= $end6; $l5++) {
            a = $l5;
            aArr2.push(rtl.getObject(aJson[i])[aProps[a]]);
          };
          Self.Grid.addRow(aId,aArr2);
        };
        Self.Tabs.cells("content").hide();
        Self.Tabs.cells("data").show();
        Self.Tabs.cells("data").setActive();
        return Result;
      };
      function DoLoadIData(aValue) {
        var Result = undefined;
        var aUrl = "";
        function AddParamToUrl(aParam) {
          if (Self.ContentForm.getUserData(aParam,"statistics","n") == "y") aUrl = (((aUrl + "&") + aParam) + "=") + ("" + Self.ContentForm.getItemValue(aParam));
        };
        aUrl = ((("\/" + Self.FTablename) + "\/by-id\/") + ("" + Self.FID)) + "\/rawdata.json";
        aUrl = aUrl + "?exec=1";
        Self.ContentForm.forEachItem(AddParamToUrl);
        pas.Avamm.LoadData(aUrl,false,"",15000).then(DoShowData);
        return Result;
        return Result;
      };
      Self.Layout.progressOn();
      Self.ReportsLoaded.then(DoLoadIData);
    };
  });
  this.Statistics = null;
  this.ShowStatistic = function (URl, aRoute, Params) {
    var aForm = null;
    aForm = $mod.TStatisticsForm.$create("Create$1",[pas.AvammForms.TAvammFormMode.fmInlineWindow,"statistics",Params.GetValue("Id"),Params.GetValue("Params")]);
  };
  this.ShowStatistics = function (URl, aRoute, Params) {
    var aParent = null;
    if ($mod.Statistics === null) {
      aParent = rtl.getObject(pas.Avamm.GetAvammContainer());
      $mod.Statistics = pas.AvammForms.TAvammListForm.$create("Create$2",[aParent,"statistics","1C"]);
      $mod.Statistics.Grid.setHeader("Name,Status");
      $mod.Statistics.Grid.setColumnIds("NAME,STATUS");
      $mod.Statistics.Grid.setColTypes("ro,ro");
      $mod.Statistics.SetFilterHeader("#text_filter,#text_filter");
      $mod.Statistics.Grid.setInitWidths("*,100");
      $mod.Statistics.Grid.init();
    };
    $mod.Statistics.Show();
  };
  $mod.$resourcestrings = {strReports: {org: "Berichte"}, strContent: {org: "Inhalt"}, strExecute: {org: "Ausführen"}, strNoReport: {org: "kein Bericht verfügbar !"}, strSettings: {org: "Einstellungen"}, strRawData: {org: "Daten"}};
  $mod.$init = function () {
    if (pas.Avamm.getRight("STATISTICS") > 0) pas.Avamm.RegisterSidebarRoute(rtl.getResStr(pas.statistics,"strReports"),"statistics",$mod.ShowStatistics,"fa-file-text");
    pas.webrouter.Router().RegisterRoute("\/statistics\/by-id\/:Id\/:Params",$mod.ShowStatistic,false);
  };
});
//# sourceMappingURL=statistics.js.map
