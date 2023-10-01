<#assign data = input.data?eval >
<#assign company = data.company >
<#assign total = data.total >
<#assign movements = data.movements >
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE pdf PUBLIC "-//big.faceless.org//report" "report-1.1.dtd">
<pdf>
   <head>
      <meta name="title" value="Formato 12.1" />
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
                <td width="25%" align = "center " style= "border:1px solid black; font-weight:bold; vertical-align: middle">CORRELATIVO</td>
                <td width="25%" align = "center " style= "border:1px solid black; font-weight:bold; vertical-align: middle">COD DEL CATÁLOGO UTILIZADO</td>
                <td width="25%" align = "center " style= "border:1px solid black; font-weight:bold; vertical-align: middle">COD DEL CATÁLOGO UTILIZADO 2</td>
                <td width="25%" align = "center " style= "border:1px solid black; font-weight:bold; vertical-align: middle">TIPO DE EXISTENCIA</td>
                <td width="25%" align = "center " style= "border:1px solid black; font-weight:bold; vertical-align: middle">COD. PROPIO DE EXISTENCIA CAMPO 5</td>
                <td width="25%" align = "center " style= "border:1px solid black; font-weight:bold; vertical-align: middle">COD DEL CATÁLOGO UTILIZADO 3</td>
                <td width="25%" align = "center " style= "border:1px solid black; font-weight:bold; vertical-align: middle">COD. PROPIO DE EXISTENCIA CAMPO 8</td>
                <td width="25%" align = "center " style= "border:1px solid black; font-weight:bold; vertical-align: middle">FECHA DE EMISIÓN</td>
                <td width="25%" align = "center " style= "border:1px solid black; font-weight:bold; vertical-align: middle">TIPO DE DOCUMENTO</td>
                <td width="25%" align = "center " style= "border:1px solid black; font-weight:bold; vertical-align: middle">NRO DE SERIE DEL DOCUMENTO</td>
                <td width="25%" align = "center " style= "border:1px solid black; font-weight:bold; vertical-align: middle">NRO DEL DOCUMENTO</td>
                <td width="25%" align = "center " style= "border:1px solid black; font-weight:bold; vertical-align: middle">COD DE OPERACIÓN</td>
                <td width="25%" align = "center " style= "border:1px solid black; font-weight:bold; vertical-align: middle">DESC. DE LA EXISTENCIA</td>
                <td width="25%" align = "center " style= "border:1px solid black; font-weight:bold; vertical-align: middle">COD DE LA UNIDAD DE MEDIDA</td>
                <td width="25%" align = "center " style= "border:1px solid black; font-weight:bold; vertical-align: middle">ENT. UNIDADES FÍSICAS</td>
                <td width="25%" align = "center " style= "border:1px solid black; font-weight:bold; vertical-align: middle">SAL. UNIDADES FÍSICA</td>
                <td width="25%" align = "center " style= "border:1px solid black; font-weight:bold; vertical-align: middle">ESTADO</td>
            </tr>
            <#list movements as key,mov>
                <tr>
                    <td width="25%" align = "center">${mov.periodoContable}</td>
                    <td width="25%" align = "center">${mov.cuo}</td>
                    <td width="25%" align = "center">${mov.correlativo}</td>
                    <td width="25%" align = "center">${mov.codigoCatalogo}</td>
                    <td width="25%" align = "center">${mov.codigoCatalogo2}</td>
                    <td width="25%" align = "center">${mov.tipoExistencia}</td>
                    <td width="25%" align = "center">${mov.propioExistencia}</td>
                    <td width="25%" align = "center">${mov.codigoCatalogo3}</td>
                    <td width="25%" align = "center">${mov.propioExistencia2}</td>
                    <td width="25%" align = "center">${mov.fechaEmision}</td>
                    <td width="25%" align = "center">${mov.tipoDocumento}</td>
                    <td width="25%" align = "center">${mov.serieDocumento}</td>
                    <td width="25%" align = "center">${mov.nroDocumento}</td>
                    <td width="25%" align = "center">${mov.codOperacion}</td>
                    <td width="25%" align = "center">${mov.descExistencia}</td>
                    <td width="25%" align = "center">${mov.unidMedida}</td>
                    <td width="25%" align = "center">${mov.entradasUnidFisicas}</td>
                    <td width="25%" align = "center">${mov.salidaUnidFisicas}</td>
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
                    <td width="25%" align = "center" style= "border-top:1px solid black"><b>TOTAL GENERAL</b></td>
                    <td width="25%" align = "right" style= "border-top:1px solid black">${total.entradasUnidFisicas}</td>
                    <td width="25%" align = "right" style= "border-top:1px solid black">${total.entradasUnidFisicas}</td>
                </tr>
        </table>
    </body>
</pdf>