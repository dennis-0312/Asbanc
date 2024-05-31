/**
*
* Task          Date            Author                                         Remarks
* GAP 12        28 Jun 2023     Alexander Ruesta <aruesta@myevol.biz>          - Crear reporte de cotrol presupuestal.
*/

let GLOBAL = {},
	GLOBALKEY = {
		"getTransactions":{
			"end":false
		}
	},
	DATAPRINT = [],
	COLUMNAS = 0;
jQuery(document).ready(function () {
	let data = getParametres();
    console.log('Entro' + JSON.stringify(data))
	if (data.custpage_anio != null && data.custpage_anio != '') {
		nlapiSetFieldValue('custpage_htmlreport', setMessage('Cargando...'))
		
		let data = getParametres();
		data.suitelet = 'getTransactions';
		data.thread = 1;
		data.threads = 10;
		getInformation(data);

	}else{
        nlapiSetFieldValue('custpage_htmlreport', setMessage('Seleccione filtros ...'))
    }

	jQuery('.group_spoiler').click(function () {
		var filterTr = jQuery(this).closest('tr').next();
		filterTr.toggle();
		if (filterTr.css('display') == 'none') {
			jQuery(this).children('img').attr('src', '/images/forms/plus.svg');
		} else {
			jQuery(this).children('img').attr('src', '/images/forms/minus.svg');
		}

	});
})

const getParametres = () => {
	let inputs = nlapiGetFieldValue('custpage_filters'),
		arrInputs = inputs.split(','),
		result = {};
	arrInputs.forEach(function (field) {
		result[field] = nlapiGetFieldValue(field);
	})
	return result;
}

const getInformation= (paramData) =>{			
	if (!GLOBAL[paramData.suitelet]){
		GLOBAL[paramData.suitelet] = {};
	}
	console.log('paramData' + JSON.stringify(paramData))
	var script = nlapiGetFieldValue('custpage_script');
	var deploy = nlapiGetFieldValue('custpage_deploy');
	jQuery.ajax({
		type: 'POST',
		dataType: 'json',
		data: paramData,
		async: true,
		url: '/app/site/hosting/scriptlet.nl?script=' + script + '&deploy=' + deploy + '&suitelet=' + paramData.suitelet,
		success: function (dataReturn, textStatus, jqXHR) {
			try {
				let globalTemp_1 = dataReturn,
					globalTemp_2 = GLOBAL[paramData.suitelet];
					//lengthData = Object.keys(dataReturn).length
					console.log('data ' + paramData.suitelet  + '->>> ' + JSON.stringify(paramData) )
					
				if(Object.keys(globalTemp_1).length == 0){
					GLOBALKEY[paramData.suitelet]['end'] = true;
				}else {
					GLOBAL[paramData.suitelet] =  globalTemp_1;
					paramData.thread = paramData.thread + 1;
					paramData.json = JSON.stringify(GLOBAL[paramData.suitelet]);
					getInformation(paramData);
				}
				let flag = true;
				for (var key in GLOBALKEY) {
					console.log(GLOBALKEY[key])
					if (!GLOBALKEY[key]['end']) {
						flag = false
					}
				}

				if(flag){
					console.log('Debe entrar una vezs')
					printInformation();
				}
				
			} catch (e) {
				console.error(paramData.suitelet + e);
				nlapiSetFieldValue('custpage_htmlreport', setMessage('Error success ' + paramData.suitelet + '!'))
			}

		},
		error: function (jqXHR, textStatus, errorThrown) {
			console.error(textStatus, errorThrown);
			nlapiSetFieldValue('custpage_htmlreport', setMessage('Error cargando ' + paramData.suitelet + '!'))
		}

	});
}

const printInformation = () => {
	let title = 'print Information';
	try {
		
		/*nlapiSetFieldValue('custpage_htmlreport', setMessage( JSON.stringify(GLOBAL)))
		return;*/
        let strTable = '', 
			headers =  ["Subsidiaria","Clase", "Departamento","Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Set", "Oct", "Nov", "Dic", "Total"],
			replaceSimbol = new RegExp(/[^A-Za-z0-9]+/g);
		
		strTable += '<table id="main_table">';
		
		strTable += '<thead><tr>';
			headers.forEach(function (header) {
				strTable += '<td><b>' + header + '</b></td>'
				COLUMNAS++;
			})
		strTable += '</tr></thead>';
		
		strTable += '<tfoot><tr>';
			headers.forEach(function (header) {
				strTable += '<td><b>' + header + '</b></td>'
			})
		strTable += '</tr></tfoot>';
		
		strTable += '<tbody>';
		
        let jsonSearch = GLOBAL['getTransactions'];
        console.log('JsonSearch => ' + JSON.stringify(jsonSearch));
        for(let key in jsonSearch){
            let flag = true;
            jsonSearch[key].forEach(element => {
                if(flag){
                    var row = getRow(element, key, '', 0);
                    strTable += row.table; //nivel 1
                    flag = false;
                }
                if(element.version == 'P5' || element.version == 'P6'){
                    var row = getRow(element, element.version, key, 2);
                }else{
                    var row = getRow(element, element.version, key, 1);
                }
                strTable += row.table;
            });
        }
     
		console.log('Termino')
		strTable += '</tbody></table>';

		nlapiSetFieldValue('custpage_htmlreport', strTable);
		
		jQuery("#main_table").treetable({ expandable: true, initialState: "expanded" });

		jQuery('#custpage_exportar').click(function () {
			//getPrintExcel()
		});

		jQuery('#custpage_exp').click(function () {
			setTimeout(function () {
				jQuery('#main_table').treetable('expandAll');
				return false;
			}, 500);
		});
		jQuery('#custpage_hide').click(function () {
			setTimeout(function () {
				jQuery('#main_table').treetable('collapseAll');
				return false;
			}, 500);
		});

		jQuery('#custpage_excel').click(function () {
			printExcel(GLOBAL['getTransactions'])
		});

		jQuery('#custpage_seleccionar').click(function () {
			jQuery('[type="checkbox"]').prop('checked', true);
		});
		jQuery('#custpage_desmarcar').click(function () {
			jQuery('[type="checkbox"]').prop('checked', false);
		});

		jQuery('.number').html(function () {
			return accounting.formatMoney(jQuery(this).html())
		})

		console.log(title, 'end');
	} catch (e) {
		console.error(title, e)
	}
}
const getRow = (GroupFields, key, parent, group) => {
	console.log('Group_>> ' + JSON.stringify(GroupFields))
	let strTable = '',
		thisJson = {};
		parent = parent || ''
		key = key || '';
	
	strTable += '<tr data-tt-id="' + key + '" data-tt-parent-id="' + parent + '" class="group' + group + '">';
	
	if(group == 0){
		 // Fila Clase
		 strTable += '<td>';
		 thisJson.Subsidiary =  '<b>' + GroupFields.subsidiary + '</b>' || '';
		 thisJson.Group = group;
		 strTable += thisJson.Subsidiary;
		 strTable += '</td>';

        // Fila Clase
	    strTable += '<td>';
	    thisJson.Class =  '<b>' + GroupFields.class + '</b>' || '';
	    thisJson.Group = group;
	    strTable += thisJson.Class;
	    strTable += '</td>';
        
        // Fila Departamento
        strTable += '<td>';
        thisJson.Department =  '<b>' + GroupFields.department + '</b>' || '';
        thisJson.Group = group;
        strTable += thisJson.Department;
        strTable += '</td>';

	}else if(group == 2){
        // Fila Clase vacio
	    strTable += '<td>';
	    thisJson.Class = '';
	    thisJson.Group = group;
	    strTable += thisJson.Class;
	    strTable += '</td>';

		// Fila Clase vacio
	    strTable += '<td>';
	    thisJson.Class = '';
	    thisJson.Group = group;
	    strTable += thisJson.Class;
	    strTable += '</td>';
        
        // Fila Version
        strTable += '<td>';
        thisJson.Version =  '<b>' + GroupFields.nameLine + '</b>' || '';
        thisJson.Group = group;
        strTable += thisJson.Version;
        strTable += '</td>';

        //Meses
		strTable += '<td></td>';
		strTable += '<td></td>';
		strTable += '<td></td>';
		strTable += '<td></td>';
		strTable += '<td></td>';
		strTable += '<td></td>';
		strTable += '<td></td>';
		strTable += '<td></td>';
		strTable += '<td></td>';
		strTable += '<td></td>';
		strTable += '<td></td>';
		strTable += '<td></td>';
		if(GroupFields.version == 'P5'){
			//Total
			strTable += '<td class="number">';
			thisJson.Total = GroupFields.total || '';
			strTable += thisJson.Total;
			strTable += '</td>';
		}else{
			//Total
			strTable += '<td align="right">';
			thisJson.Total = (GroupFields.total).toFixed(2) || '';
			strTable += thisJson.Total;
			strTable += '%</td>';
		}
    

    }else{
		// Fila Clase vacio
	    strTable += '<td>';
	    thisJson.Class = '';
	    thisJson.Group = group;
	    strTable += thisJson.Class;
	    strTable += '</td>';

		// Fila Clase vacio
	    strTable += '<td>';
	    thisJson.Class = '';
	    thisJson.Group = group;
	    strTable += thisJson.Class;
	    strTable += '</td>';
        
        // Fila Version
        strTable += '<td>';
        thisJson.Version =  '<b>' + GroupFields.version + '</b>' || '';
        thisJson.Group = group;
        strTable += thisJson.Version;
        strTable += '</td>';

        //Enero
		strTable += '<td class="number">';
		thisJson.Ene = GroupFields.ene || '';
		strTable += thisJson.Ene;
		strTable += '</td>';

		//Febrero
		strTable += '<td class="number">';
		thisJson.Feb = GroupFields.feb || '';
		strTable += thisJson.Feb; //thisJson.Ene; rhuaccha 09-02-2024
		strTable += '</td>';

        //Marzo
		strTable += '<td class="number">';
		thisJson.Mar = GroupFields.mar || '';
		strTable += thisJson.Mar;
		strTable += '</td>';

		//Abril
		strTable += '<td class="number">';
		thisJson.Abr = GroupFields.abr || '';
		strTable += thisJson.Abr;
		strTable += '</td>';

		//Mayo
		strTable += '<td class="number">';
		thisJson.May = GroupFields.may || '';
		strTable += thisJson.May;
		strTable += '</td>';

		//Junio
		strTable += '<td class="number">';
		thisJson.Jun = GroupFields.jun || '';
		strTable += thisJson.Jun;
		strTable += '</td>';

		//Julio
		strTable += '<td class="number">';
		thisJson.Jul = GroupFields.jul || '';
		strTable += thisJson.Jul;
		strTable += '</td>';
		//Agosto
		strTable += '<td class="number">';
		thisJson.Ago = GroupFields.ago || '';
		strTable += thisJson.Ago;
		strTable += '</td>';
		//Setiembre
		strTable += '<td class="number">';
		thisJson.Sep = GroupFields.sep || '';
		strTable += thisJson.Sep;
		strTable += '</td>';
		//Octubre
		strTable += '<td class="number">';
		thisJson.Oct = GroupFields.oct || '';
		strTable += thisJson.Oct;
		strTable += '</td>';

		//Noviembre
		strTable += '<td class="number">';
		thisJson.Nov = GroupFields.nov || '';
		strTable += thisJson.Nov;
		strTable += '</td>';

		//Diciembre
		strTable += '<td class="number">';
		thisJson.Dic = GroupFields.dic || '';
		strTable += thisJson.Dic;
		strTable += '</td>';

		//Total
		strTable += '<td class="number">';
		thisJson.Total = GroupFields.total || '';
		strTable += thisJson.Total;
		strTable += '</td>';
	}

	return {
		table: strTable,
		row: thisJson
	}
}
const printExcel = (paramData) => {
	let xmlString = printStyleExcel();

	xmlString += '<Worksheet ss:Name="Reporte Presupuestal">';
	xmlString += '<Table>';

	xmlString += '<Column ss:Index="2" ss:AutoFitWidth="0" ss:Width="200"/>';
	xmlString += '<Column ss:AutoFitWidth="0" ss:Width="250"/>';
	xmlString += '<Column ss:AutoFitWidth="0" ss:Width="250"/>';
	xmlString += '<Column ss:StyleID="s98" ss:AutoFitWidth="0" ss:Span="12"/>';
	

	xmlString += '<Row/>';
	xmlString += '<Row/>';

	xmlString += '<Row>';
	xmlString += '<Cell ss:Index="2" ss:StyleID="s83"><Data ss:Type="String">Subsidiaria </Data></Cell>';
	xmlString += '<Cell ss:StyleID="s83"><Data ss:Type="String">Clase </Data></Cell>';
	xmlString += '<Cell ss:StyleID="s83"><Data ss:Type="String">Departamento</Data></Cell>';
	xmlString += '<Cell ss:StyleID="s83"><Data ss:Type="String">Ene</Data></Cell>';
	xmlString += '<Cell ss:StyleID="s83"><Data ss:Type="String">Feb</Data></Cell>';
	xmlString += '<Cell ss:StyleID="s83"><Data ss:Type="String">Mar</Data></Cell>';
	xmlString += '<Cell ss:StyleID="s83"><Data ss:Type="String">Abr</Data></Cell>';
	xmlString += '<Cell ss:StyleID="s83"><Data ss:Type="String">Mayo</Data></Cell>';
	xmlString += '<Cell ss:StyleID="s83"><Data ss:Type="String">Jun</Data></Cell>';
	xmlString += '<Cell ss:StyleID="s83"><Data ss:Type="String">Jul</Data></Cell>';
	xmlString += '<Cell ss:StyleID="s83"><Data ss:Type="String">Ago</Data></Cell>';
	xmlString += '<Cell ss:StyleID="s83"><Data ss:Type="String">Set</Data></Cell>';
	xmlString += '<Cell ss:StyleID="s83"><Data ss:Type="String">Oct</Data></Cell>';
	xmlString += '<Cell ss:StyleID="s83"><Data ss:Type="String">Nov</Data></Cell>';
	xmlString += '<Cell ss:StyleID="s83"><Data ss:Type="String">Dic</Data></Cell>';
	xmlString += '<Cell ss:StyleID="s83"><Data ss:Type="String">TOTAL</Data></Cell>';
	xmlString += '</Row>';

	for(var key in paramData){
		let flag = true;
		paramData[key].forEach(function(line){
			
			if(flag){
				xmlString += '<Row/>';
				xmlString += '<Row>';
				xmlString += '<Cell ss:Index="2" ss:StyleID="s86"><Data ss:Type="String">' + line.subsidiary+ '</Data></Cell>';
				xmlString += '<Cell ss:StyleID="s86"><Data ss:Type="String">' + line.class+ '</Data></Cell>';
				xmlString += '<Cell ss:StyleID="s86"><Data ss:Type="String">' + line.department+ '</Data></Cell>';
				xmlString += '</Row>';
				flag = false;
			}
			xmlString += '<Row>';
			if(line.version == 'P5'){
				xmlString += '<Cell ss:Index="4" ss:StyleID="s85"><Data ss:Type="String">' + line.nameLine + '</Data></Cell>';
				xmlString += '<Cell ss:StyleID="s99"/>';
				xmlString += '<Cell ss:StyleID="s99"/>';
				xmlString += '<Cell ss:StyleID="s99"/>';
				xmlString += '<Cell ss:StyleID="s99"/>';
				xmlString += '<Cell ss:StyleID="s99"/>';
				xmlString += '<Cell ss:StyleID="s99"/>';
				xmlString += '<Cell ss:StyleID="s99"/>';
				xmlString += '<Cell ss:StyleID="s99"/>';
				xmlString += '<Cell ss:StyleID="s99"/>';
				xmlString += '<Cell ss:StyleID="s99"/>';
				xmlString += '<Cell ss:StyleID="s99"/>';
				xmlString += '<Cell ss:StyleID="s99"/>';
				xmlString += '<Cell ss:StyleID="s99"><Data ss:Type="Number">' + line.total + '</Data></Cell>';

			}else if(line.version == 'P6'){
				xmlString += '<Cell ss:Index="2" ss:StyleID="s73"/>';
				xmlString += '<Cell ss:StyleID="s73"/>';
				xmlString += '<Cell ss:StyleID="s73"><Data ss:Type="String">' + line.nameLine + '</Data></Cell>';
				xmlString += '<Cell ss:StyleID="s73"/>';
				xmlString += '<Cell ss:StyleID="s73"/>';
				xmlString += '<Cell ss:StyleID="s73"/>';
				xmlString += '<Cell ss:StyleID="s73"/>';
				xmlString += '<Cell ss:StyleID="s73"/>';
				xmlString += '<Cell ss:StyleID="s73"/>';
				xmlString += '<Cell ss:StyleID="s73"/>';
				xmlString += '<Cell ss:StyleID="s73"/>';
				xmlString += '<Cell ss:StyleID="s73"/>';
				xmlString += '<Cell ss:StyleID="s73"/>';
				xmlString += '<Cell ss:StyleID="s73"/>';
				xmlString += '<Cell ss:StyleID="s73"/>';
				xmlString += '<Cell ss:StyleID="s75"><Data ss:Type="Number">' + Number(line.total)/100 + '</Data></Cell>';

			}else{
				xmlString += '<Cell ss:Index="4" ss:StyleID="s85"><Data ss:Type="String">' + line.version+ '</Data></Cell>';
				xmlString += '<Cell ss:StyleID="s99"><Data ss:Type="Number">' + line.ene + '</Data></Cell>';
				xmlString += '<Cell ss:StyleID="s99"><Data ss:Type="Number">' + line.feb + '</Data></Cell>';
				xmlString += '<Cell ss:StyleID="s99"><Data ss:Type="Number">' + line.mar + '</Data></Cell>';
				xmlString += '<Cell ss:StyleID="s99"><Data ss:Type="Number">' + line.abr + '</Data></Cell>';
				xmlString += '<Cell ss:StyleID="s99"><Data ss:Type="Number">' + line.may + '</Data></Cell>';
				xmlString += '<Cell ss:StyleID="s99"><Data ss:Type="Number">' + line.jun + '</Data></Cell>';
				xmlString += '<Cell ss:StyleID="s99"><Data ss:Type="Number">' + line.jul + '</Data></Cell>';
				xmlString += '<Cell ss:StyleID="s99"><Data ss:Type="Number">' + line.ago + '</Data></Cell>';
				xmlString += '<Cell ss:StyleID="s99"><Data ss:Type="Number">' + line.sep + '</Data></Cell>';
				xmlString += '<Cell ss:StyleID="s99"><Data ss:Type="Number">' + line.oct + '</Data></Cell>';
				xmlString += '<Cell ss:StyleID="s99"><Data ss:Type="Number">' + line.nov + '</Data></Cell>';
				xmlString += '<Cell ss:StyleID="s99"><Data ss:Type="Number">' + line.dic + '</Data></Cell>';
				xmlString += '<Cell ss:StyleID="s99"><Data ss:Type="Number">' + line.total + '</Data></Cell>';
			}
			xmlString += '</Row>';

		})
	}

	xmlString += '</Table></Worksheet></Workbook>';
	
	let xmlStringBlob = new Blob([xmlString], { type: 'text/plain' });

	downloadFileInBrowser(xmlStringBlob, '.xls');
}

const printStyleExcel = () => {
	let strExcel = '';

	strExcel += '<?xml version="1.0" encoding="UTF-8" ?><?mso-application progid="Excel.Sheet"?>';
	//strExcel += '<?mso-application progid="Excel.Sheet"?>';
	strExcel += '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" ';
	strExcel += 'xmlns:o="urn:schemas-microsoft-com:office:office" ';
	strExcel += 'xmlns:x="urn:schemas-microsoft-com:office:excel" ';
	strExcel += 'xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet" ';
	strExcel += 'xmlns:html="http://www.w3.org/TR/REC-html40">';
	//Estilos de Celdas
	strExcel += '<Styles>';
	strExcel += '<Style ss:ID="Default" ss:Name="Normal">';
	strExcel += '<Alignment ss:Vertical="Bottom"/>';
	strExcel += '<Borders/>';
	strExcel += '<Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Color="#000000"/>';
	strExcel += '<Interior/>';
	strExcel += '<NumberFormat/>';
	strExcel += '<Protection/>';
	strExcel += '</Style>';
	strExcel += '<Style ss:ID="s20" ss:Name="Porcentaje">';
	strExcel += '<NumberFormat ss:Format="0%"/>';
	strExcel += '</Style>';
	strExcel += '<Style ss:ID="s63">';
	strExcel += '<Alignment ss:Vertical="Center"/>';
	strExcel += '</Style>';
	strExcel += '<Style ss:ID="s73">';
	strExcel += '<Borders>';
    strExcel += '<Border ss:Position="Bottom" ss:LineStyle="Double" ss:Weight="3"/>';
	strExcel += '</Borders>';
	strExcel += '</Style>';
	strExcel += '<Style ss:ID="s75">';
	strExcel += '<Borders>';
	strExcel += '<Border ss:Position="Bottom" ss:LineStyle="Double" ss:Weight="3"/>';
	strExcel += '</Borders>';
	strExcel += '<Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Color="#000000"/>';
	strExcel += '<Interior ss:Color="#FFFF00" ss:Pattern="Solid"/>';
	strExcel += '<NumberFormat ss:Format="Percent"/>';
	strExcel += '</Style>';
	strExcel += '<Style ss:ID="s76">';
	strExcel += '<Alignment ss:Horizontal="Center" ss:Vertical="Center"/>';
	strExcel += '<Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="16" ss:Color="#FFFFFF" ss:Bold="1"/>';
	strExcel += '<Interior ss:Color="#002060" ss:Pattern="Solid"/>';
	strExcel += '</Style>';
	strExcel += '<Style ss:ID="s83">';
	strExcel += '<Alignment ss:Horizontal="Center" ss:Vertical="Center"/>';
	strExcel += '<Borders>';
	strExcel += '<Border ss:Position="Bottom" ss:LineStyle="Double" ss:Weight="3"/>';
	strExcel += '</Borders>';
	strExcel += '<Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="14" ss:Color="#000000" ss:Bold="1"/>';
	strExcel += '</Style>';
	strExcel += '<Style ss:ID="s85">';
	strExcel += '<Borders/>';
	strExcel += '</Style>';
	strExcel += '<Style ss:ID="s86">';
	strExcel += ' <Borders>';
    strExcel += '<Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2"/>';
	strExcel += '</Borders>';
	strExcel += '<Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Color="#000000" ss:Bold="1" ss:Italic="1"/>';
	strExcel += '</Style>';
	strExcel += '<Style ss:ID="s96">';
	strExcel += '<Borders>';
	strExcel += '<Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2"/>';
	strExcel += '<Border ss:Position="Top" ss:LineStyle="Double" ss:Weight="3"/>';
	strExcel += '</Borders>';
	strExcel += '</Style>';
	strExcel += '<Style ss:ID="s97">';
	strExcel += '<Alignment ss:Vertical="Center"/>';
	strExcel += '<NumberFormat ss:Format="Fixed"/>';
	strExcel += '</Style>';
	strExcel += '<Style ss:ID="s98">';
	strExcel += '<NumberFormat ss:Format="Fixed"/>';
	strExcel += '</Style>';
	strExcel += '<Style ss:ID="s99">';
	strExcel += '<Borders/>';
	strExcel += '<NumberFormat ss:Format="Fixed"/>';
	strExcel += '</Style>';
	strExcel += '<Style ss:ID="s102">';
	strExcel += '<Borders/>';
	strExcel += '<Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Color="#000000"/>';
	strExcel += '<Interior ss:Color="#FFFF00" ss:Pattern="Solid"/>';
	strExcel += '<NumberFormat ss:Format="Percent"/>';
	strExcel += '</Style>';
	strExcel += '</Styles>';

	return strExcel ;
}

const downloadFileInBrowser = (blobFile, extension) => {
	let link = document.createElement("a");
	link.href = window.URL.createObjectURL(blobFile);
	link.setAttribute("download", "ReportePresupuestal" + extension);
	link.style.display = "none";
	document.body.appendChild(link);
	
	link.click();
	setTimeout(function () {
		document.body.removeChild(link);
	}, 5e3);

}

const getComparePeriods = (paramInit, paramFin, paramDate) => {
	let date_1 = paramInit,
	dia1  = date_1.substring(0,2),
	mes1  = Number(date_1.substring(3,5)),
	anio1 = Number(date_1.substring(6,10)),
	resulDate_1 = new Date(anio1,mes1,dia1);

	let date_2 = paramFin,
	dia2  = date_2.substring(0,2),
	mes2  = Number(date_2.substring(3,5)),
	anio2 = Number(date_2.substring(6,10)),
	resulDate_2 = new Date(anio2,mes2,dia2);


	let date_3 = paramDate,
	dia3  = date_3.substring(0,2),
	mes3  = Number(date_3.substring(3,5)),
	anio3 = Number(date_3.substring(6,10)),
	resulDate_3 = new Date(anio3,mes3,dia3);

	if(resulDate_1 < resulDate_3 && resulDate_2 > resulDate_3){
		return true;
	}

	return false;
}

const setMessage = (msg) => {
	let html = '<br><div style="';
	html += 'background:#D7FCCF';
	html += ';border: 1px solid #2acc14';
	html += ';padding: 10px';
	html += ';text-align: center';
	html += ';font-weight:bold';
	html += ';font-size:16px';
	html += '">';
	html += msg;
	html += '</div>';
	return html;
}