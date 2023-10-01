<#assign data = input.data?eval >
<#assign company = data.company >
<#assign total = data.total >
<#assign movements = data.movements >
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE pdf PUBLIC "-//big.faceless.org//report" "report-1.1.dtd">
<pdf>
   <head>
      <meta name="title" value="Formato 6.1" />
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
                <td width="25%" align = "center " style= "border:1px solid black; font-weight:bold; vertical-align: middle">CUO</td>
                <td width="25%" align = "center " style= "border:1px solid black; font-weight:bold; vertical-align: middle">NÚMERO CORRELATIVO DEL ASIENTO</td>
                <td width="25%" align = "center " style= "border:1px solid black; font-weight:bold; vertical-align: middle">COD DE LA CUENTA CONTABLE</td>
                <td width="25%" align = "center " style= "border:1px solid black; font-weight:bold; vertical-align: middle">CÓDIGO DE UNIDAD DE OPERACIÓN</td>
                <td width="25%" align = "center " style= "border:1px solid black; font-weight:bold; vertical-align: middle">CENTRO DE COSTO</td> 6
                <td width="25%" align = "center " style= "border:1px solid black; font-weight:bold; vertical-align: middle">TIPO DE MONEDA DE ORIGEN</td>
                <td width="25%" align = "center " style= "border:1px solid black; font-weight:bold; vertical-align: middle">TIPO DE DOCUMENTO DE IDENTIDAD DEL EMISOR</td>
                <td width="25%" align = "center " style= "border:1px solid black; font-weight:bold; vertical-align: middle">NÚMERO DE DOCUMENTO DE IDENTIDAD DEL EMISOR</td>
                <td width="25%" align = "center " style= "border:1px solid black; font-weight:bold; vertical-align: middle">TIPO DE COMPROBANTE</td>
                <td width="25%" align = "center " style= "border:1px solid black; font-weight:bold; vertical-align: middle">NÚMERO DE SERIE DEL COMPROBANTE DE PAGO</td>
                <td width="25%" align = "center " style= "border:1px solid black; font-weight:bold; vertical-align: middle">NÚMERO DE COMPRONBANTE DE PAGO</td>
                <td width="25%" align = "center " style= "border:1px solid black; font-weight:bold; vertical-align: middle">FECHA CONTABLE</td>
                <td width="25%" align = "center " style= "border:1px solid black; font-weight:bold; vertical-align: middle">FECHA DE VENCIMIENTO</td>
                <td width="25%" align = "center " style= "border:1px solid black; font-weight:bold; vertical-align: middle">FECHA DE LA OPERACIÓN O EMISIÓN</td>
                <td width="25%" align = "center " style= "border:1px solid black; font-weight:bold; vertical-align: middle">GLOSA O DESCRIPCIÓN DE LA NATURALEZA DE LA OPERACIÓN REGISTRADA DE SER EL CASO</td>
                <td width="25%" align = "center " style= "border:1px solid black; font-weight:bold; vertical-align: middle">GLOSA REFERENCIAL</td>
                <td width="25%" align = "center " style= "border:1px solid black; font-weight:bold; vertical-align: middle">MOVIMIENTOS DEL DEBE</td>
                <td width="25%" align = "center " style= "border:1px solid black; font-weight:bold; vertical-align: middle">MOVIMIENTO DEL HABER</td>
                <td width="25%" align = "center " style= "border:1px solid black; font-weight:bold; vertical-align: middle">COD LIBRO</td>
                <td width="25%" align = "center " style= "border:1px solid black; font-weight:bold; vertical-align: middle">CAMPO123</td>
                <td width="25%" align = "center " style= "border:1px solid black; font-weight:bold; vertical-align: middle">INDICA EL ESTADO DE LA OPERACIÓN</td>
            </tr>
            <#list movements as key,mov>
                <tr>
                    <td width="25%" align = "center">${mov.periodoContable}</td>
                    <td width="25%" align = "center">${mov.cuo}</td>
                    <td width="25%" align = "center">${mov.numAsiento}</td>
                    <td width="25%" align = "center">${mov.codCuenta}</td>
                    <td width="25%" align = "center">${mov.codOp}</td>
                    <td width="25%" align = "center">${mov.ceco}</td>
                    <td width="25%" align = "center">${mov.tipoMoneda}</td>
                    <td width="25%" align = "center">${mov.tipoDocIdentidad}</td>
                    <td width="25%" align = "center">${mov.numDocIdentidad}</td>
                    <td width="25%" align = "center">${mov.tipoComprob}</td>
                    <td width="25%" align = "center">${mov.serieComprob}</td>
                    <td width="25%" align = "center">${mov.comprobPago}</td>
                    <td width="25%" align = "center">${mov.fecha}</td>
                    <td width="25%" align = "center">${mov.dueDate}</td>
                    <td width="25%" align = "center">${mov.fechaOp}</td>
                    <td width="25%" align = "center">${mov.glosaDesc}</td>
                    <td width="25%" align = "center">${mov.glosaRef}</td>
                    <td width="25%" align = "center">${mov.movDebe}</td>
                    <td width="25%" align = "center">${mov.movHaber}</td>
                    <td width="25%" align = "center">${mov.codLibro}</td>
                    <td width="25%" align = "center">${mov.codLibro2}</td>
                    <td width="25%" align = "center">${mov.estadoOp}</td>
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
                    <td width="25%" align = "center"></td>
                    <td width="25%" align = "center"></td>
                    <td width="25%" align = "center"></td>
                    <td width="25%" align = "center"></td>
                    <td width="25%" align = "center"></td>
                    <td width="25%" align = "center"></td>
                    <td width="25%" align = "center"></td>
                    <td width="25%" align = "center"></td>
                    <td width="25%" align = "center" style= "border-top:1px solid black"><b>TOTAL GENERAL</b></td>
                    <td width="25%" align = "center" style= "border-top:1px solid black">${total.movDebe}</td>
                    <td width="25%" align = "center" style= "border-top:1px solid black">${total.movHaber}</td>
                </tr>
        </table>
    </body>
</pdf>