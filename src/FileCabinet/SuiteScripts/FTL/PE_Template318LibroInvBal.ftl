<#assign data = input.data?eval >
<#assign company = data.company >
<#assign totals = data.totals >
<#assign movements = data.movements >
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE pdf PUBLIC "-//big.faceless.org//report" "report-1.1.dtd">
<pdf>
   <head>
      <meta name="title" value="Formato 3.18" />
      <macrolist>
         <macro id = "cabecera">
            <table width="100%">
               <tr>
                  <td colspan="4" width="100%" align="left"><b>${company.firtsTitle}</b></td>
               </tr>
               <tr>
                  <td></td>
               </tr>
                <tr>
                    <td colspan="4" width="100%" align="left"><b>EJERCICIO: ${company.secondTitle}</b></td>
               </tr>
                <tr>
                    <td colspan="4" width="100%" align="left"><b>RUC: ${company.thirdTitle}</b></td>
               </tr>
                <tr>
                    <td colspan="4" width="100%" align="left"><b>RAZON SOCIAL: ${company.fourthTitle?upper_case}</b></td>
               </tr>
            </table>
         </macro>
      </macrolist>
      <style type="text/css">
            * {
                <#if .locale=="zh_CN">font-family: NotoSans, NotoSansCJKsc, sans-serif;
                <#elseif .locale=="zh_TW">font-family: NotoSans, NotoSansCJKtc, sans-serif;
                <#elseif .locale=="ja_JP">font-family: NotoSans, NotoSansCJKjp, sans-serif;
                <#elseif .locale=="ko_KR">font-family: NotoSans, NotoSansCJKkr, sans-serif;
                <#elseif .locale=="th_TH">font-family: NotoSans, NotoSansThai, sans-serif;
                <#else>font-family: NotoSans, sans-serif;
                </#if>
            }

            table {
                font-size: 9pt;
                table-layout: fixed;
            }

            th {
                font-weight: bold;
                font-size: 8pt;
                vertical-align: middle;
                padding: 5px 6px 3px;
                background-color: #333333;
                color: #333333;
            }

            td {
                padding: 4px 6px;
            }

            td p {
                align: left
            }

            b {
                font-weight: bold;
                color: #333333;
            }

            table.header td {
                padding: 0;
                font-size: 10pt;
            }

            table.footer td {
                padding: 0;
                font-size: 8pt;
            }

            table.itemtable th {
                padding-bottom: 10px;
                padding-top: 10px;
            }

            table.body td {
                padding-top: 2px;
            }

            .borderheader {
               /*border-width: top */
               border-width: 1px 1px 1px 1px;
               border-style: solid;
               border-color: black;
            }

            .borderheader2 {
               /*border-width: top right bottom left */
               border-width: 1px 1px 1px 0px;
               border-style: solid;
               border-color: black;
            }

            .borderlines {
               border-width: 0px 1px 1px 1px;
               border-style: solid;
               border-color: black;
            }

            .borderlines2 {
               /*border-width: top right bottom left */
               border-width: 0px 1px 1px 0px;
               border-style: solid;
               border-color: black;
            }

            .fontweightbold {
               font-weight:bold
            }
      </style>
   </head>
    <body background-color="white" font-size="8" size="A4-landscape" header = "cabecera" header-height="25mm" footer-height="10mm" padding="0.5in 0.5in 0.5in 0.5in">
       <table style="font-family: Verdana, Arial, Helvetica, sans-serif; width:100%" >
            <tr>
               <td width="75%" align = "center " class="borderheader fontweightbold">ACTIVIDADES</td>
               <td width="25%" align = "center " class="borderheader2 fontweightbold">EJERCICIO O PERIODO</td>
            </tr>
            <#list movements as key,mov>
                <tr>
                    <td width="25%" align = "left" class="borderlines">${mov.dato2}</td>
                    <td width="75%" align = "right" class="borderlines2">${mov.dato3?string["#,###.00"]}</td>
                </tr>
            </#list>
            <tr>
                <td width="75%" align="left" class="borderlines fontweightbold"></td>
                <td width="25%" align="right" class="borderlines2 fontweightbold"></td>
            </tr>
            <tr>
               <td width="75%" align = "left" class="borderlines fontweightbold">Aumento (Disminución) del Efectivo y Equivalente de Efectivo Provenientes de Actividades de Operación</td>
               <td width="25%" align = "right" class="borderlines2 fontweightbold">${totals.dato3?string["#,###.00"]}</td>
            </tr>
        </table>
    </body>
</pdf>