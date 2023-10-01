<#assign data = input.data?eval >
<#assign company = data.company >
<#assign total = data.total >
<#assign movements = data.movements >
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE pdf PUBLIC "-//big.faceless.org//report" "report-1.1.dtd">
<pdf>
   <head>
      <meta name="title" value="Formato 9.2" />
      <macrolist>
         <macro id = "cabecera">
            <table width="100%">
               <tr>
                  <td colspan="4" width="100%" align="center"><b>${company.firtsTitle}</b></td>
               </tr>
                <tr>
                    <td width="50%" align="left"><b>PERIODO</b></td>
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
                    <td width="50%" align="left"><b>APELLIDOS Y NOMBRES, DENOMINACION O RAZON SOCIAL</b></td>
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
                <td width="25%" align = "center " style= "border:1px solid black; font-weight:bold; vertical-align: middle">PERIODO</td>
                <td width="25%" align = "center " style= "border:1px solid black; font-weight:bold; vertical-align: middle">FECHA DE RECEPCION</td>
                <td width="25%" align = "center " style= "border:1px solid black; font-weight:bold; vertical-align: middle">FECHA</td>
                <td width="25%" align = "center " style= "border:1px solid black; font-weight:bold; vertical-align: middle">TIPO DE EXISTENCIA</td>
                <td width="25%" align = "center " style= "border:1px solid black; font-weight:bold; vertical-align: middle">SERIE DE GUÍA DE REMISIÓN</td>
                <td width="25%" align = "center " style= "border:1px solid black; font-weight:bold; vertical-align: middle">NÚMERO DE GUÍA DE REMISIÓN</td>
                <td width="25%" align = "center " style= "border:1px solid black; font-weight:bold; vertical-align: middle">SERIE DE COMPROBANTE DE PAGO</td>
                <td width="25%" align = "center " style= "border:1px solid black; font-weight:bold; vertical-align: middle">NÚMERO DE COMPROBANTE DE PAGO</td>
                <td width="25%" align = "center " style= "border:1px solid black; font-weight:bold; vertical-align: middle">RUC</td>
                <td width="25%" align = "center " style= "border:1px solid black; font-weight:bold; vertical-align: middle">RAZÓN SOCIAL</td>
                <td width="25%" align = "center " style= "border:1px solid black; font-weight:bold; vertical-align: middle">CANTIDAD ENTREGADA</td>
                <td width="25%" align = "center " style= "border:1px solid black; font-weight:bold; vertical-align: middle">CANTIDAD DEVUELTA</td>
                <td width="25%" align = "center " style= "border:1px solid black; font-weight:bold; vertical-align: middle">CANTIDAD VENDIDA</td>
                <td width="25%" align = "center " style= "border:1px solid black; font-weight:bold; vertical-align: middle">SALDO</td>
            </tr>
            <#list movements as key,mov>
                <tr>
                    <td width="25%" align = "center">${mov.periodoContable}</td>
                    <td width="25%" align = "center">${mov.fechaRecepcion}</td>
                    <td width="25%" align = "center">${mov.fecha}</td>
                    <td width="25%" align = "center">${mov.tipoExistencia}</td>
                    <td width="25%" align = "center">${mov.serieGuia}</td>
                    <td width="25%" align = "center">${mov.nroGuia}</td>
                    <td width="25%" align = "center">${mov.serieComprobante}</td>
                    <td width="25%" align = "center">${mov.nroComprobante}</td>
                    <td width="25%" align = "center">${mov.ruc}</td>
                    <td width="25%" align = "center">${mov.razonSocial}</td>
                    <td width="25%" align = "center">${mov.sumEntregada}</td>
                    <td width="25%" align = "center">${mov.sumDevuelta}</td>
                    <td width="25%" align = "center">${mov.sumVendida}</td>
                    <td width="25%" align = "center">${mov.sumSaldo}</td>
                </tr>
            </#list>
                <tr>
                    <td width="25%" align = "center"></td>
                    <td width="25%" align = "center"></td>
                    <td width="25%" align = "center"></td>
                    <td width="25%" align = "center"></td>
                    <td width="25%" align = "center"></td>
                    <td width="25%" align = "center"></td>
                    <td width="25%" align = "center"></td>
                    <td width="25%" align = "center"></td>
                    <td width="25%" align = "center"></td>
                    <td width="25%" align = "center" style= "border-top:1px solid black"><b>TOTAL GENERAL</b></td>
                    <td width="25%" align = "center" style= "border-top:1px solid black">${total.sumEntregada}</td>
                    <td width="25%" align = "center" style= "border-top:1px solid black">${total.sumDevuelta}</td>
                    <td width="25%" align = "center" style= "border-top:1px solid black">${total.sumVendida}</td>
                    <td width="25%" align = "center" style= "border-top:1px solid black">${total.sumSaldo}</td>
                </tr>
        </table>
    </body>
</pdf>