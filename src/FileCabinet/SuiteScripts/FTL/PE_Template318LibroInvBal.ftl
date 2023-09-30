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
                  <td colspan="4" width="100%" align="center"><b>${company.firtsTitle}</b></td>
               </tr>
                <tr>
                    <td width="50%" align="left"><b>EJERCICIO</b></td>
                    <td width="5%" align="right"><b>:</b></td>
                    <td width="30%" align="left">${company.secondTitle}</td>
                    <td width="15%" align="left"></td>
               </tr>
                <tr>
                    <td width="50%" align="left"><b>RUC</b></td>
                    <td width="5%" align="right"><b>:</b></td>
                    <td width="30%" align="left">${company.thirdTitle}</td>
                    <td width="15%" align="left"></td>
               </tr>
                <tr>
                    <td width="50%" align="left"><b>DENOMINACION O RAZON SOCIAL</b></td>
                    <td width="5%" align="right"><b>:</b></td>
                    <td width="30%" align="left">${company.fourthTitle}</td>
                    <td width="15%" align="left"></td>
               </tr>
            </table>
         </macro>
      </macrolist>
   </head>
    <body background-color="white" font-size="8" size="A4-landscape" header = "cabecera" header-height="25mm" footer-height="10mm">
       <table style="font-family: Verdana, Arial, Helvetica, sans-serif; width:100%" >
            <tr>
               <td width="75%" align = "center " style= "border:1px solid black; font-weight:bold">ACTIVIDADES</td>
               <td width="25%" align = "center " style= "border:1px solid black; font-weight:bold">EJERCICIO O PERIODO</td>
            </tr>
            <#list movements as key,mov>
                <tr>
                    <td width="75%" style= "border-right:1px solid black" align = "left">Prueba</td>
                    <td width="25%" style= "border-right:1px solid black" align = "center">${mov.dato2}</td>
                </tr>
            </#list>
             <tr>
                  <td width="75%" align = "center">${totals.dato3}</td>
                  <td width="25%" align = "center">${totals.dato3}</td>
               </tr>
        </table>
    </body>
</pdf>