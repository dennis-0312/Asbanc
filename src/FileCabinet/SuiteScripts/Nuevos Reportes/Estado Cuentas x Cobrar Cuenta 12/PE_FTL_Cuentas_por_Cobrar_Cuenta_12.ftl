<#setting locale = "computer">
<#setting number_format = "computer">
<#assign jsonContent = jsonString.text?eval>
<#assign transactions = jsonContent.transactions>
<#assign customers = jsonContent.customers>
<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">
  <Author>NetSuite</Author>
  <LastAuthor>NetSuite</LastAuthor>
  <LastSaved>2024-04-12T00:51:45Z</LastSaved>
  <Company>NetSuite</Company>
  <Version>16.00</Version>
 </DocumentProperties>
 <OfficeDocumentSettings xmlns="urn:schemas-microsoft-com:office:office">
  <AllowPNG/>
 </OfficeDocumentSettings>
 <ExcelWorkbook xmlns="urn:schemas-microsoft-com:office:excel">
  <WindowHeight>11865</WindowHeight>
  <WindowWidth>28800</WindowWidth>
  <WindowTopX>32767</WindowTopX>
  <WindowTopY>32767</WindowTopY>
  <ProtectStructure>False</ProtectStructure>
  <ProtectWindows>False</ProtectWindows>
 </ExcelWorkbook>
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Bottom"/>
   <Borders/>
   <Font ss:FontName="Arial" ss:Size="8"/>
   <Interior/>
   <NumberFormat/>
  </Style>
  <Style ss:ID="s18" ss:Name="Moneda">
   <NumberFormat
    ss:Format="_-&quot;S/&quot;\ * #,##0.00_-;\-&quot;S/&quot;\ * #,##0.00_-;_-&quot;S/&quot;\ * &quot;-&quot;??_-;_-@_-"/>
  </Style>
  <Style ss:ID="s62">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="2"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="2"/>
   </Borders>
   <Font ss:FontName="Arial" x:Family="Swiss" ss:Size="9" ss:Bold="1"/>
   <Interior ss:Color="#D0D0D0" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="s63">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="2"/>
   </Borders>
   <Font ss:FontName="Arial" x:Family="Swiss" ss:Size="9" ss:Bold="1"/>
   <Interior ss:Color="#D0D0D0" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="s64">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="2"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="2"/>
   </Borders>
   <Font ss:FontName="Arial" x:Family="Swiss" ss:Size="9" ss:Bold="1"/>
   <Interior ss:Color="#D0D0D0" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="s65">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Font ss:FontName="Arial" x:Family="Swiss"/>
  </Style>
  <Style ss:ID="s66">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Font ss:FontName="Arial" x:Family="Swiss"/>
  </Style>
  <Style ss:ID="s67">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Font ss:FontName="Arial" x:Family="Swiss"/>
   <NumberFormat ss:Format="Short Date"/>
  </Style>
  <Style ss:ID="s68">
   <Alignment ss:Horizontal="Center" ss:Vertical="Bottom"/>
  </Style>
  <Style ss:ID="s69">
   <Alignment ss:Horizontal="Left" ss:Vertical="Bottom"/>
  </Style>
  <Style ss:ID="s70">
   <NumberFormat
    ss:Format="_-[$S/-280A]\ * #,##0.00_-;\-[$S/-280A]\ * #,##0.00_-;_-[$S/-280A]\ * &quot;-&quot;??_-;_-@_-"/>
  </Style>
  <Style ss:ID="s72" ss:Parent="s18">
   <Font ss:FontName="Arial" ss:Size="8"/>
   <NumberFormat
    ss:Format="_-[$$-45C]* #,##0.00_-;\-[$$-45C]* #,##0.00_-;_-[$$-45C]* &quot;-&quot;??_-;_-@_-"/>
  </Style>
  <Style ss:ID="s73" ss:Parent="s18">
   <Font ss:FontName="Arial" ss:Size="8"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="ResultadosTSEstadoCambioPatrim">
  <Names>
   <NamedRange ss:Name="_FilterDatabase"
    ss:RefersTo="=ResultadosTSEstadoCambioPatrim!R1C1:R1C18" ss:Hidden="1"/>
  </Names>
  <Table ss:ExpandedColumnCount="18" ss:ExpandedRowCount="${transactions?size + 10}" x:FullColumns="1"
   x:FullRows="1" ss:DefaultColumnWidth="54" ss:DefaultRowHeight="11.25">
   <Column ss:AutoFitWidth="0" ss:Width="95.25"/>
   <Column ss:AutoFitWidth="0" ss:Width="75"/>
   <Column ss:AutoFitWidth="0" ss:Width="57.75"/>
   <Column ss:AutoFitWidth="0" ss:Width="75"/>
   <Column ss:AutoFitWidth="0" ss:Width="127.5"/>
   <Column ss:AutoFitWidth="0" ss:Width="82.5"/>
   <Column ss:AutoFitWidth="0" ss:Width="63.75"/>
   <Column ss:AutoFitWidth="0" ss:Width="97.5"/>
   <Column ss:AutoFitWidth="0" ss:Width="75"/>
   <Column ss:AutoFitWidth="0" ss:Width="206.25"/>
   <Column ss:AutoFitWidth="0" ss:Width="228.75"/>
   <Column ss:AutoFitWidth="0" ss:Width="63.75"/>
   <Column ss:AutoFitWidth="0" ss:Width="75"/>
   <Column ss:AutoFitWidth="0" ss:Width="63.75"/>
   <Column ss:AutoFitWidth="0" ss:Width="75" ss:Span="3"/>
   <Row ss:AutoFitHeight="0" ss:Height="36.75">
    <Cell ss:StyleID="s62"><Data ss:Type="String">ID INTERNO DE TRANSACCIÓN</Data><NamedCell
      ss:Name="_FilterDatabase"/></Cell>
    <Cell ss:StyleID="s63"><Data ss:Type="String">PERIODO CONTABLE</Data><NamedCell
      ss:Name="_FilterDatabase"/></Cell>
    <Cell ss:StyleID="s63"><Data ss:Type="String">FECHA EMISIÓN</Data><NamedCell
      ss:Name="_FilterDatabase"/></Cell>
    <Cell ss:StyleID="s63"><Data ss:Type="String">FECHA VENCIMIENTO</Data><NamedCell
      ss:Name="_FilterDatabase"/></Cell>
    <Cell ss:StyleID="s63"><Data ss:Type="String">Nº DE FACTURA DE&#10;VENTA</Data><NamedCell
      ss:Name="_FilterDatabase"/></Cell>
    <Cell ss:StyleID="s63"><Data ss:Type="String">ID SUNAT</Data><NamedCell
      ss:Name="_FilterDatabase"/></Cell>
    <Cell ss:StyleID="s63"><Data ss:Type="String">TIPO DOC</Data><NamedCell
      ss:Name="_FilterDatabase"/></Cell>
    <Cell ss:StyleID="s63"><Data ss:Type="String">NÚMERO DE DOCUMENTO DE IDENTIDAD</Data><NamedCell
      ss:Name="_FilterDatabase"/></Cell>
    <Cell ss:StyleID="s63"><Data ss:Type="String">CÓDIGO RECAUDADOR</Data><NamedCell
      ss:Name="_FilterDatabase"/></Cell>
    <Cell ss:StyleID="s63"><Data ss:Type="String">CLIENTE</Data><NamedCell
      ss:Name="_FilterDatabase"/></Cell>
    <Cell ss:StyleID="s63"><Data ss:Type="String">DESCRIPCION DOCUMENTO</Data><NamedCell
      ss:Name="_FilterDatabase"/></Cell>
    <Cell ss:StyleID="s63"><Data ss:Type="String">ID GESTOR</Data><NamedCell
      ss:Name="_FilterDatabase"/></Cell>
    <Cell ss:StyleID="s63"><Data ss:Type="String">CENTRO DE COSTO</Data><NamedCell
      ss:Name="_FilterDatabase"/></Cell>
    <Cell ss:StyleID="s63"><Data ss:Type="String">DIVISA</Data><NamedCell
      ss:Name="_FilterDatabase"/></Cell>
    <Cell ss:StyleID="s63"><Data ss:Type="String">IMPORTE DE DOCUMENTO&#10;S/.</Data><NamedCell
      ss:Name="_FilterDatabase"/></Cell>
    <Cell ss:StyleID="s63"><Data ss:Type="String">IMPORTE DE DOCUMENTO&#10;$</Data><NamedCell
      ss:Name="_FilterDatabase"/></Cell>
    <Cell ss:StyleID="s63"><Data ss:Type="String">IMPORTE PENDIENTE&#10;S/.</Data><NamedCell
      ss:Name="_FilterDatabase"/></Cell>
    <Cell ss:StyleID="s64"><Data ss:Type="String">IMPORTE PENDIENTE&#10;$</Data><NamedCell
      ss:Name="_FilterDatabase"/></Cell>
   </Row>
    <#list transactions as transaction>
   <Row ss:AutoFitHeight="0" ss:Height="12.75">
    <Cell ss:StyleID="s65"><Data ss:Type="String">${transaction.idInterno}</Data></Cell>
    <Cell ss:StyleID="s66"><Data ss:Type="String">${transaction.periodo}</Data></Cell>
    <Cell ss:StyleID="s67"><Data ss:Type="DateTime">${transaction.fecha}</Data></Cell>
    <Cell ss:StyleID="s67"><Data ss:Type="DateTime">${transaction.fechaVencimiento}</Data></Cell>
    <Cell ss:StyleID="s66"><Data ss:Type="String">${transaction.numeroDocumento}</Data></Cell>
    <Cell ss:StyleID="s68"><Data ss:Type="String">${transaction.numeroDocumentoFel}</Data></Cell>
    <Cell ss:StyleID="s68"><Data ss:Type="String">${transaction.tipoDocumento}</Data></Cell>
    <Cell ss:StyleID="s68"><Data ss:Type="String">${customers[transaction.customerId].numeroDocumento}</Data></Cell>
    <Cell ss:StyleID="s68"><Data ss:Type="String">${customers[transaction.customerId].codigoRecaudador}</Data></Cell>
    <Cell ss:StyleID="s69"><Data ss:Type="String">${customers[transaction.customerId].nombre}</Data></Cell>
    <Cell ss:StyleID="s69"><Data ss:Type="String">${transaction.nota}</Data></Cell>
    <Cell ss:StyleID="s68"><Data ss:Type="String">${transaction.gestor}</Data></Cell>
    <Cell ss:StyleID="s68"><Data ss:Type="String">${transaction.centroCosto}</Data></Cell>
    <Cell ss:StyleID="s68"><Data ss:Type="String">${transaction.moneda}</Data></Cell>
    <Cell ss:StyleID="s70"><Data ss:Type="Number">${transaction.importeMonedaBase}</Data></Cell>
    <Cell ss:StyleID="s72"><Data ss:Type="Number">${transaction.importeMonedaExtranjera}</Data></Cell>
    <Cell ss:StyleID="s73"><Data ss:Type="Number">${transaction.importePendienteMonedaBase}</Data></Cell>
    <Cell ss:StyleID="s72"><Data ss:Type="Number">${transaction.importePendienteMonedaExtranjera}</Data></Cell>
   </Row>
   </#list>
  </Table>
  <WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel">
   <PageSetup>
    <Layout x:Orientation="Landscape"/>
   </PageSetup>
   <Unsynced/>
   <Print>
    <ValidPrinterInfo/>
    <PaperSizeIndex>9</PaperSizeIndex>
    <HorizontalResolution>600</HorizontalResolution>
    <VerticalResolution>600</VerticalResolution>
   </Print>
   <Selected/>
   <ProtectObjects>False</ProtectObjects>
   <ProtectScenarios>False</ProtectScenarios>
  </WorksheetOptions>
  <AutoFilter x:Range="R1C1:R2C18"
   xmlns="urn:schemas-microsoft-com:office:excel">
  </AutoFilter>
 </Worksheet>
</Workbook>
