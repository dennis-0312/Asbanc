<#assign data = input.data?eval >
<#assign company = data.company >
<#assign totalDebit = data.totalDebit >
<#assign totalCredit = data.totalCredit >
<#assign movements = data.movements >
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE pdf PUBLIC "-//big.faceless.org//report" "report-1.1.dtd">
<pdf>
   <head>
      <meta name="title" value="Formato 5.1" />
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
                <td width="25%" rowspan="2" align = "center " style= "border:1px solid black; font-weight:bold; vertical-align: middle">
                  <table>
                    <tr><td align="center" style="text-align:center;">NÚMERO</td></tr>
                    <tr><td align="center" style="text-align:center;">CORRELATIVO</td></tr>
                    <tr><td align="center" style="text-align:center;">DEL ASIENTO</td></tr>
                    <tr><td align="center" style="text-align:center;">O CÓDIGO</td></tr>
                    <tr><td align="center" style="text-align:center;">ÚNICO DE LA</td></tr>
                    <tr><td align="center" style="text-align:center;">OPERACIÓN</td></tr>
                  </table> 
                </td>
                <td width="25%" rowspan="2" align = "center " style= "border:1px solid black; font-weight:bold; vertical-align: middle">
                  <table>
                    <tr><td align="center" style="text-align:center;">FECHA DE</td></tr>
                    <tr><td align="center" style="text-align:center;">OPERACIÓN</td></tr>
                  </table> 
                </td>
                <td width="25%" rowspan="2" align = "center " style= "border:1px solid black; font-weight:bold; vertical-align: middle">
                  <table>
                    <tr><td align="center" style="text-align:center;">GLOSA O</td></tr>
                    <tr><td align="center" style="text-align:center;">DESCRIPCIÓN</td></tr>
                    <tr><td align="center" style="text-align:center;">DE LA OPERACIÓN</td></tr>
                  </table> 
                </td>
                <td width="25%" colspan="3" align = "center " style= "border:1px solid black; font-weight:bold; vertical-align: middle">REFERENCIA DE LA OPERACIÓN</td>
                <td width="25%" colspan="2" align = "center " style= "border:1px solid black; font-weight:bold">
                  <table>
                    <tr><td align="center" style="text-align:center;">CUENTA CONTABLE ASOCIADA</td></tr>
                    <tr><td align="center" style="text-align:center;">A LA OPERACIÓN</td></tr>
                  </table> 
                </td>
                <td width="25%" colspan="2" align = "center " style= "border:1px solid black; font-weight:bold; vertical-align: middle">MOVIMIENTO</td>
            </tr>
            <tr>
                <td width="25%" align = "center " style= "border:1px solid black; font-weight:bold">
                  <table>
                    <tr><td align="center" style="text-align:center;">CÓDIGO</td></tr>
                    <tr><td align="center" style="text-align:center;">DEL</td></tr>
                    <tr><td align="center" style="text-align:center;">LIBRO O</td></tr>
                    <tr><td align="center" style="text-align:center;">REGISTRO</td></tr>
                    <tr><td align="center" style="text-align:center;">(TABLA 8)</td></tr>
                  </table>
                </td>
                <td width="25%" align = "center " style= "border:1px solid black; font-weight:bold; vertical-align: middle">
                  <table>
                    <tr><td align="center" style="text-align:center;">NÚMERO</td></tr>
                    <tr><td align="center" style="text-align:center;">CORRELATIVO</td></tr>
                  </table>
                </td>
                <td width="25%" align = "center " style= "border:1px solid black; font-weight:bold; vertical-align: middle">
                  <table>
                    <tr><td align="center" style="text-align:center;">NÚMERO DEL</td></tr>
                    <tr><td align="center" style="text-align:center;">DOCUMENTO</td></tr>
                    <tr><td align="center" style="text-align:center;">SUSTENTATORION</td></tr>
                  </table>                 
                </td>
                <td width="25%" align = "center " style= "border:1px solid black; font-weight:bold; vertical-align: middle">CÓDIGO</td>
                <td width="25%" align = "center " style= "border:1px solid black; font-weight:bold; vertical-align: middle">DENOMINACIÓN</td>
                <td width="25%" align = "center " style= "border:1px solid black; font-weight:bold; vertical-align: middle">DEBE</td>
                <td width="25%" align = "center " style= "border:1px solid black; font-weight:bold; vertical-align: middle">HABER</td>
            </tr>
            <#list movements as key,mov>
                <tr>
                    <td width="25%" align = "center">${mov.numberCorr}</td>
                    <td width="25%" align = "center">${mov.date}</td>
                    <td width="25%" align = "center">${mov.description}</td>
                    <td width="25%" align = "center">${mov.bookCode}</td>
                    <td width="25%" align = "center">${mov.numberUnique}</td>
                    <td width="25%" align = "center">${mov.numberDoc}</td>
                    <td width="25%" align = "center">${mov.code}</td>
                    <td width="25%" align = "left">${mov.denomination}</td>
                    <td width="25%" align = "right">${mov.debit}</td>
                    <td width="25%" align = "right">${mov.credit}</td>
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
                    <td width="25%" align = "center" style= "border-top:1px solid black"><b>TOTAL GENERAL</b></td>
                    <td width="25%" align = "right" style= "border-top:1px solid black">${totalDebit.total}</td>
                    <td width="25%" align = "right" style= "border-top:1px solid black">${totalCredit.total}</td>
                </tr>
        </table>
    </body>
</pdf>