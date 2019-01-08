library statistics;
  uses js, web, classes, Avamm, webrouter, AvammForms, dhtmlx_base,
    dhtmlx_form,SysUtils, Types,dhtmlx_toolbar,dhtmlx_grid;

type

  { TStatisticsForm }

  TStatisticsForm = class(TAvammForm)
  private
    ContentLoadedEvent: Integer;
    ContToolbar : TDHTMLXToolbar;
    FPdf : JSValue;
    aFrame: TJSWindow;
    Grid : TDHTMLXGrid;
  protected
    ContentForm : TDHTMLXForm;
    procedure DoLoadData; override;
    procedure DoEnterKeyPressed; override;
    procedure CreateForm;
    procedure DoFormChange(Id,value : JSValue); override;
    procedure ContToolBarClicked(id : string);
    procedure DoOpen;
    procedure DoExecute;
    procedure ShowData;
  end;

resourcestring
  strReports             = 'Berichte';
  strContent             = 'Inhalt';
  strExecute             = 'Ausführen';
  strNoReport            = 'kein Bericht verfügbar !';
  strSettings            = 'Einstellungen';
  strRawData             = 'Daten';

var
  Statistics : TAvammListForm = nil;
Procedure ShowStatistic(URl : String; aRoute : TRoute; Params: TStrings);
var
  aForm: TAvammForm;
begin
  aForm := TStatisticsForm.Create(fmInlineWindow,'statistics',Params.Values['Id'],Params.Values['Params']);
end;
Procedure ShowStatistics(URl : String; aRoute : TRoute; Params: TStrings);
var
  aParent: TJSHTMLElement;
begin
  if Statistics = nil then
    begin
      aParent := TJSHTMLElement(GetAvammContainer());
      Statistics := TAvammListForm.Create(aParent,'statistics');
      Statistics.Grid.setHeader('Name,Status');
      Statistics.Grid.setColumnIds('NAME,STATUS');
      Statistics.Grid.setColTypes('ro,ro');
      Statistics.FilterHeader := '#text_filter,#text_filter';
      Statistics.Grid.setInitWidths('*,100');
      Statistics.Grid.init();
    end;
  Statistics.Show;
end;

{ TStatisticsForm }
procedure TStatisticsForm.DoLoadData;
begin
  CreateForm;
  inherited;
  DoOpen;
  Form.setFocusOnFirstActive;
end;

procedure TStatisticsForm.DoEnterKeyPressed;
begin
  DoExecute;
end;

procedure TStatisticsForm.CreateForm;
  procedure ToolbarButtonClick(id : string);
  begin
    if (id='execute') then
      begin
        DoExecute;
      end
    else if (id='rawdata') then
      begin
        ShowData;
      end
    ;
  end;
begin
  Tabs.addTab('content',strContent,100,0,true,false);
  Tabs.cells('content').hide;
  Form.hideItem('eShorttext');
  Form.hideItem('lCommon');
  TJSHTMLElement(Tabs.cont.children.item(0).childNodes.item(0)).style.setProperty('height','0px');
  Toolbar.addButton('execute',0,strExecute,'fa fa-pie-chart','fa fa-pie-chart');
  Toolbar.addButton('rawdata',8,strRawData,'fa fa-table','fa fa-table');
  Form.addItem(null,js.new(['type','label','label',strSettings,'hidden',true,'name','lSettings']));
  Toolbar.attachEvent('onClick', @ToolbarButtonClick);
  ContentForm := Form;
  ContToolbar := TDHTMLXToolbar(Tabs.cells('content').attachToolbar(new(['iconset','awesome'])));
  ContToolbar.addButton('zoom+',null,'','fa fa-search-plus','fa fa-search-plus');
  ContToolbar.addButton('zoom-',null,'','fa fa-search-minus','fa fa-search-minus');
  ContToolbar.disableItem('zoom+');
  ContToolbar.disableItem('zoom-');
  ContToolbar.attachEvent('onClick',@ContToolBarClicked);
  Tabs.addTab('data',strContent,100,0,true,false);
  Tabs.cells('data').hide;
  Grid := TDHTMLXGrid(Tabs.cells('data').attachGrid(new([])));
end;

procedure TStatisticsForm.DoFormChange(Id,value: JSValue);
begin
  if ContentForm.getUserData(string(Id),'statistics','n') <> 'y' then
    inherited DoFormChange(Id,value);
end;

procedure TStatisticsForm.ContToolBarClicked(id: string);
var
  aPdf : JSValue;
begin
  aPdf := FPdf;
  if id = 'zoom+' then
    begin
      asm
        this.aFrame.scale+=0.1;
        this.aFrame.contdiv.innerHTML = "";
        this.aFrame.currPage = 1;
        this.aFrame.renderPdf(aPdf);
      end;
    end
  else if id = 'zoom-' then
    begin
      asm
        this.aFrame.scale-=0.1;
        this.aFrame.contdiv.innerHTML = "";
        this.aFrame.currPage = 1;
        this.aFrame.renderPdf(aPdf);
      end;
    end;
end;

procedure TStatisticsForm.DoOpen;
  procedure CheckRemoveItem(aName : string);
  begin
    if ContentForm.getUserData(aName,'statistics','n')='y' then
      ContentForm.removeItem(aName);
  end;
var
  aQuerry: string;
  aRegex: TJSRegexp;
  aCont: TStringDynArray;
  HasControls,
  DontExecute: Boolean;
  aHeight, i: Integer;
  aDiv: TJSElement;
begin
  DontExecute:=False;
  aQuerry := string(Data.Properties['QUERRY']);
  aRegex := TJSRegexp.New('@(.*?):(.*?)@');
  aCont := aRegex.exec(aQuerry);
  HasControls := False;
  ContentForm.forEachItem(@CheckRemoveItem);
  aHeight := 70;
  i := 0;
  while i < length(aCont) do
    begin
      inc(i);
      ContentForm.addItem(null,js.new(['type','input','name',aCont[i],'label',aCont[i],'value','*']));
      if Params.Values[aCont[i]]<>'' then
        ContentForm.setItemValue(aCont[i],Params.Values[aCont[i]])
      else
        DontExecute := True;
      ContentForm.setUserData(aCont[i],'statistics','y');
      HasControls:=True;
      inc(i,2);
      aHeight:=aHeight+70;
    end;
  if HasControls then
    ContentForm.showItem('lSettings')
  else
    ContentForm.hideItem('lSettings');
  DoSetFormSize;
  Tabs.cells('history').hide;
  if Data.Properties['DESCRIPTION']<>nil then
    begin
      Tabs.addTab('description',strDescription,null,1,false,false);
      aDiv := document.createElement('div');
      Tabs.cells('description').appendObject(aDiv);
      aDiv.innerHTML:=string(Data.Properties['DESCRIPTION']);
    end;
  if not DontExecute then
    DoExecute;
end;
procedure TStatisticsForm.DoExecute;
  function DoShowPDF(aValue: TJSXMLHttpRequest): JSValue;
    procedure PDFIsLoaded;
    var
      aRequest: TJSXMLHttpRequest;
      aPdf : TJSPromise;
      function SetPDF(aValue: JSValue): JSValue;
      var
        elm: TJSElement;
        function DoScroll(event : JSValue) : Boolean;
        var
          supportsWheel : Boolean;
          delta : Integer;
          strg : Boolean;
        begin
          try
            asm
              //if (event.type == "wheel") supportsWheel = true;
              delta = ((event.deltaY || -event.wheelDelta || event.detail) >> 10) || 1;
              strg = event.ctrlKey;
            end;
            if not strg then exit;
            if delta >0 then
              ContToolBarClicked('zoom-')
            else
              ContToolBarClicked('zoom+');
            //event.detail is positive for a downward scroll, negative for an upward scroll
            //scale = scale + (event.detail*0.05);
            asm
              event.preventDefault();
            end;
          except
          end;
          result := False;
        end;

      begin
        FPdf := aValue;
        ContToolbar.enableItem('zoom+');
        ContToolbar.enableItem('zoom-');
        try
          asm
            elm = Self.aFrame.contdiv;
          end;
          elm.addEventListener('DOMMouseScroll',@DoScroll);
          elm.addEventListener('wheel',@DoScroll);
          elm.addEventListener('mousewheel',@DoScroll);
          elm.addEventListener('scroll',@DoScroll);
        except
        end;
      end;
      procedure SetPDFo;
      begin
        aPdf._then(@SetPDF);
      end;
    begin
      if aValue.Status<>200 then
        begin
          Layout.progressOff;
          dhtmlx.message(js.new(['type','error',
                                 'text',aValue.responseText]));
          ShowData;
          Tabs.cells('content').hide;
        end
      else
        begin
          aFrame := Tabs.cells('content').getFrame;
          Avamm.InitWindow(aFrame);
          aRequest := aValue;
          Tabs.cells('content').show;
          Tabs.cells('content').setActive;
          Layout.progressOff;
          asm
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
          end;
          window.setTimeout(@SetPDFo,100);
          Tabs.detachEvent(ContentLoadedEvent);
        end;
    end;
  begin
    with Tabs.cells('content') do
      begin
        attachURL('/appbase/pdfview.html');
        Avamm.InitWindow(getFrame);
      end;
    ContentLoadedEvent := Tabs.attachEvent('onContentLoaded',@PDFIsLoaded);
  end;
  function DoLoadPDF(aValue: TJSXMLHttpRequest): JSValue;
  var
    aReports: TJSArray;
    aName,aExt, aUrl: String;
    i: Integer;
    ReportLoaded: Boolean = False;

    procedure AddParamToUrl(aParam : string);
    begin
      if (ContentForm.getUserData(aParam,'statistics', 'n') = 'y') then
        aUrl := aUrl+'&'+aParam+'='+string(ContentForm.getItemValue(aParam));
    end;
  begin
    //Build Params
    for i := 0 to Reports.length-1 do
      begin
        aName := string(TJSObject(Reports[i]).Properties['name']);
        aExt := copy(aName,pos('.',aName)+1,length(aName));
        aName := copy(aName,0,pos('.',aName)-1);
        if aExt = 'pdf' then
          begin
            aUrl := '/'+TableName+'/by-id/'+string(Id)+'/reports/'+string(TJSObject(Reports[i]).Properties['name']);
            aUrl := aUrl+'?exec=1';
            ContentForm.forEachItem(@AddParamToUrl);
            //Load PDF
            LoadData(aUrl,False,'',15000)._then(TJSPromiseResolver(@DoShowPDF));
            ReportLoaded := True;
            exit;
          end;
      end;
    if not ReportLoaded then
      begin
        Layout.progressOff;
        Tabs.cells('content').hide;
        ShowData;
        dhtmlx.message(js.new(['type','warning',
                               'text',strNoReport]));
      end;
  end;
var
  aDiv: TJSWindow;
begin
  Layout.progressOn;
  ReportsLoaded._then(TJSPromiseresolver(@DoLoadPDF));
end;

procedure TStatisticsForm.ShowData;
function DoShowData(aValue: TJSXMLHttpRequest): JSValue;
var
  aJson: TJSArray;
  aProps: TStringDynArray;
  tmp : string;
  i, a: Integer;
  aId : JSValue;
  aArr2 : TJSArray;
begin
  Grid.clearAll(true);
  aJson := TJSArray(TJSJSON.parse(aValue.responseText));
  Layout.progressOff;
  if aJson.Length=0 then exit;
  aProps := TJSObject.getOwnPropertyNames(TJSObject(aJson.Elements[0]));
  for i := 1 to length(aProps)-1 do
    begin
      if i>1 then
        tmp := tmp+','+aProps[i]
      else
        tmp := aProps[i];
    end;
  Grid.setHeader(tmp);
  Grid.setColumnIds(tmp);
  Grid.init;
  for i := 0 to aJson.Length-1 do
    begin
      asm
        aId = (new Date()).valueOf();
      end;
      aArr2 := TJSArray.new;
      aProps := TJSObject.getOwnPropertyNames(TJSObject(aJson.Elements[i]));
      for a := 1 to length(aProps)-1 do
        begin
          aArr2.push(TJSObject(aJson.Elements[i]).Properties[aProps[a]]);
        end;
      Grid.addRow(aId,aArr2);
    end;
  Tabs.cells('content').hide;
  Tabs.cells('data').show;
  Tabs.cells('data').setActive;
end;

function DoLoadIData(aValue: TJSXMLHttpRequest): JSValue;
var
  aName,aExt, aUrl: String;
  i: Integer;
  ReportLoaded: Boolean = False;

  procedure AddParamToUrl(aParam : string);
  begin
    if (ContentForm.getUserData(aParam,'statistics', 'n') = 'y') then
      aUrl := aUrl+'&'+aParam+'='+string(ContentForm.getItemValue(aParam));
  end;
begin
  //Build Params
  aUrl := '/'+TableName+'/by-id/'+string(Id)+'/rawdata.json';
  aUrl := aUrl+'?exec=1';
  ContentForm.forEachItem(@AddParamToUrl);
  //Load Data
  LoadData(aUrl,False,'',15000)._then(TJSPromiseResolver(@DoShowData));
  exit;
end;
begin
  Layout.progressOn;
  ReportsLoaded._then(TJSPromiseresolver(@DoLoadIData));
end;

initialization
  if getRight('STATISTICS')>0 then
    RegisterSidebarRoute(strReports,'statistics',@ShowStatistics,'fa-file-text');
  Router.RegisterRoute('/statistics/by-id/:Id/:Params',@ShowStatistic);
end.

