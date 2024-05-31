/**
*
* Task          Date            Author                                         Remarks
* GAP 27        28 Jun 2023     Alexander Ruesta <aruesta@myevol.biz>          - Crear vista del reporte de Flujo de Efectivo.
*
*/

let GLOBAL = {},
	GLOBALKEY = {
		"getRecord":{
			"end":false
		},
		"getAmounts":{
			"end":false
		},
		"getPeriods":{
			"end":false
		}
	},
	DATAPRINT = [],
	COLUMNAS = 0;
jQuery(document).ready(function () {
	let data = getParametres();
    
	if ((data.custpage_from != null && data.custpage_from != '') || (data.custpage_anio != null && data.custpage_anio != '')) {
		nlapiSetFieldValue('custpage_htmlreport', setMessage('Cargando...'))
		
		let data = getParametres();
		data.suitelet = 'getRecord';
		data.thread = 1;
		data.threads = 10;
		getInformation(data);

		let dataAmount = getParametres();
		dataAmount.suitelet = 'getAmounts';
		dataAmount.thread = 1;
		dataAmount.threads = 10;
		getInformation(dataAmount);

		let dataPeriods = getParametres();
		dataPeriods.suitelet = 'getPeriods';
		dataPeriods.thread = 1;
		dataPeriods.threads = 10;
		getInformation(dataPeriods);
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
		GLOBAL[paramData.suitelet] = [];
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
					console.log('data ' + paramData.suitelet  + '->>> ' + JSON.stringify(dataReturn) )
					GLOBAL[paramData.suitelet] = globalTemp_2.concat(globalTemp_1);
				if(globalTemp_1.length == 0){
					GLOBALKEY[paramData.suitelet]['end'] = true;
				}else {
					GLOBAL[paramData.suitelet] =  globalTemp_1;
					paramData.thread = paramData.thread + 1;
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
		/*if (GLOBAL['getTransactions'].length == 0) {
			nlapiSetFieldValue('custpage_htmlreport', setMessage('No transactions!'))
			return;
		}*/

        let groups = [];
		groups[0] = alasql('SELECT "ACTIVIDADES DE " AS Auxiliar_1, " EFECTIVO Y EQUIVALENTES DE EFECTIVO PROVENIENTES DE ACTIVIDADES DE " AS Auxiliar_2, ActividadID, Actividad AS Name FROM ? GROUP BY Actividad, ActividadID', [GLOBAL['getRecord']]);
		groups[1] = alasql('SELECT ActividadID, Actividad, SubActividadID, SubActividad AS Name, 0 AS Amount, 0 AS AmountBefore FROM ? GROUP BY ActividadID, Actividad, SubActividadID, SubActividad', [GLOBAL['getRecord']]);
		
		

		console.log('grupos' + JSON.stringify(groups))
		/*nlapiSetFieldValue('custpage_htmlreport', setMessage( JSON.stringify(GLOBAL)))
		return;*/
        let strTable = '', 
			headers =  ["Fila Financiera"],
			replaceSimbol = new RegExp(/[^A-Za-z0-9]+/g);

		GLOBAL['getPeriods'].forEach(function (line) {
			headers.push(line.PeriodName);
		})

		groups[1].forEach(function (line) {
			let objResult = GLOBAL['getAmounts'].find(function (subline) {
				return subline.SubActividadID == line.SubActividadID;
			})
			if(objResult != null){
				line.Amount = objResult.Amount;
				line.AmountBefore = objResult.AmountBefore;
			}
		})
		
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
		
        groups[0].forEach(function (firstLine) {
            let fKey = firstLine.Name + firstLine.ActividadID;
            var row = getRow(firstLine, fKey, null, 0);
			DATAPRINT.push(row.row)
			let montos = {};
			montos.befMonth = 0;
			montos.Month = 0;
            strTable += row.table;
            groups[1].forEach(function (secondtLine) {
                let sKey = secondtLine.Name + secondtLine.SubActividadID;
                    fKeyParent = secondtLine.Actividad + secondtLine.ActividadID;
                if (fKey == fKeyParent){
                    let row = getRow(secondtLine, sKey, fKeyParent, 1);
					DATAPRINT.push(row.row)
                    strTable += row.table;
					montos.befMonth += Number(secondtLine.AmountBefore) || 0;
					montos.Month += Number(secondtLine.Amount) || 0;
                }
            })
			var row = getRow(firstLine, fKey + '_total', null, 2, montos);
			DATAPRINT.push(row.row)
            strTable += row.table;
        })

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
			setDataExcel(DATAPRINT, headers)
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

const getRow = (GroupFields, key, parent, group, total) => {
	
	let strTable = '',
		thisJson = {};
		parent = parent || ''
		key = key || ''
	let label = '';
	
	strTable += '<tr data-tt-id="' + key + '" data-tt-parent-id="' + parent + '" class="group' + group + '">';
	
	if(group == 0){
		label = '<b>' + GroupFields.Auxiliar_1 + GroupFields.Name + '</b>';
	}else if(group == 2){
		console.log(total)
		label = '<b>' + GroupFields.Auxiliar_2 + GroupFields.Name + '</b>';
	}else{
		label =  GroupFields.Name ;
	}

	// Fila Finanza
	strTable += '<td>';
	thisJson.Name = label || '';
	thisJson.Group = group;
	strTable += thisJson.Name;
	strTable += '</td>';

	if(COLUMNAS > 2){
		//Importe
		if(group == 2){
			strTable += '<td class="number">';
			thisJson.AmountBefore = total.befMonth || 0;
		}else if(group == 0){
			strTable += '<td>';
			thisJson.AmountBefore = '';
		}else{
			strTable += '<td class="number">';
			thisJson.AmountBefore = GroupFields.AmountBefore || 0;
		}
		thisJson.Group = group;
		strTable += thisJson.AmountBefore;
		strTable += '</td>';
	}

	//Importe
	if(group == 2){
		strTable += '<td class="number">';
		thisJson.Amount = total.Month || 0;
	}else if(group == 0){
		strTable += '<td>';
		thisJson.Amount = '';
	}else{
		strTable += '<td class="number">';
		thisJson.Amount = GroupFields.Amount || 0;
	}
	thisJson.Group = group;
	strTable += thisJson.Amount;
	strTable += '</td>';

	strTable += '</tr>';
	return {
		table: strTable,
		row: thisJson
	}
}

const setDataExcel = (paramResult, paramHeaders) => {
	let xmlString = getStyleExcel();
	xmlString += '<Worksheet ss:Name="Flujo Efectivo">';
	xmlString += '<Table>';

	xmlString += '<Column ss:AutoFitWidth="0" ss:Width="150"/>';
	xmlString += '<Column ss:AutoFitWidth="0" ss:Width="500"/>';
	xmlString += '<Column ss:StyleID="s90" ss:AutoFitWidth="0" ss:Width="150"/>';
	xmlString += '<Column ss:StyleID="s90" ss:AutoFitWidth="0" ss:Width="150"/>';

	//TITULO
	xmlString += '<Row/>';

	xmlString += '<Row>';
	xmlString += '<Cell/>';
	xmlString += '<Cell ss:MergeAcross="3" ss:StyleID="s63" ><Data ss:Type="String">Flujo Efectivo</Data></Cell>';
	xmlString += '</Row>';
	
	xmlString += '<Row/><Row/>';

	xmlString += '<Row>';
	xmlString += '<Cell/>';
	paramHeaders.forEach(function(header){
		xmlString +=  '<Cell ss:StyleID="s88"><Data ss:Type="String">' + header + '</Data></Cell>';
	})
	xmlString += '</Row>';

	xmlString += '<Row>';
    xmlString += '<Cell ss:Index="3" ss:StyleID="s89"><Data ss:Type="String">S/.</Data></Cell>';
    xmlString += '<Cell ss:StyleID="s89"><Data ss:Type="String">S/.</Data></Cell>';
	xmlString += '</Row>';

	paramResult.forEach(element => {
		xmlString += '<Row>';
		if(element.Group == 0){
			xmlString += '<Cell ss:Index="2" ss:StyleID="s87"><Data ss:Type="String">' + element.Name + '</Data></Cell>';
		}else if(element.Group == 1){
			xmlString += '<Cell ss:Index="2" ss:StyleID="s86"><Data ss:Type="String">' + element.Name + '</Data></Cell>';
			if(COLUMNAS > 2){
				xmlString += '<Cell><Data ss:Type="Number">' + element.AmountBefore + '</Data></Cell>';
			}
			xmlString += '<Cell><Data ss:Type="Number">' + element.Amount + '</Data></Cell>';
		}else{
			xmlString += '<Cell ss:Index="2" ss:StyleID="s78"><Data ss:Type="String">' + element.Name + '</Data></Cell>';
			if(COLUMNAS > 2){
				xmlString += '<Cell ss:StyleID="s91"><Data ss:Type="Number">' + element.AmountBefore + '</Data></Cell>';
		 	}
			xmlString += '<Cell ss:StyleID="s91"><Data ss:Type="Number">' + element.Amount + '</Data></Cell>';
		}
		xmlString += '</Row>';
	});
	
	xmlString += '</Table></Worksheet></Workbook>';
	let xmlStringBlob = new Blob([xmlString], { type: 'text/plain' });

	downloadFileInBrowser(xmlStringBlob, '.xls');
    
}

const getStyleExcel = () => {
	let strExcel = ''
	//Crear Excel
	strExcel += '<?xml version="1.0" encoding="UTF-8" ?><?mso-application progid="Excel.Sheet"?>';
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
	strExcel += '<Style ss:ID="s63">';
	strExcel += '<Alignment ss:Horizontal="Center" ss:Vertical="Center"/>';
	strExcel += '<Borders/>';
	strExcel += '<Font ss:FontName="Arial" x:Family="Swiss" ss:Size="16" ss:Bold="1"/>';
	strExcel += '<Interior/>';
	strExcel += '<NumberFormat/>';
	strExcel += '<Protection/>';
	strExcel += '</Style>';
	strExcel += '<Style ss:ID="s78">';
	strExcel += '<Borders>';
    strExcel += '<Border ss:Position="Bottom" ss:LineStyle="Double" ss:Weight="3"/>';
    strExcel += '<Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/>';
	strExcel += '</Borders>';
	strExcel += '<Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Color="#000000" ss:Bold="1"/>';
	strExcel += '</Style>';
	strExcel += '<Style ss:ID="s86">';
	strExcel += '<Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Color="#000000"/>';
	strExcel += '</Style>';
	strExcel += '<Style ss:ID="s87">';
	strExcel += '<Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Color="#000000" ss:Bold="1" ss:Underline="Single"/>';
	strExcel += '</Style>';
	strExcel += '<Style ss:ID="s88">';
	strExcel += '<Alignment ss:Horizontal="Center" ss:Vertical="Bottom"/>';
	strExcel += '<Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Color="#000000" ss:Bold="1"/>';
	strExcel += '<NumberFormat ss:Format="Fixed"/>';
	strExcel += '</Style>';
	strExcel += '<Style ss:ID="s89">';
	strExcel += '<Alignment ss:Horizontal="Center" ss:Vertical="Bottom"/>';
	strExcel += '<NumberFormat ss:Format="Fixed"/>';
	strExcel += '</Style>';
	strExcel += '<Style ss:ID="s90">';
	strExcel += '<NumberFormat ss:Format="Fixed"/>';
	strExcel += '</Style>';
	strExcel += '<Style ss:ID="s91">';
	strExcel += '<Borders>';
    strExcel += '<Border ss:Position="Bottom" ss:LineStyle="Double" ss:Weight="3"/>';
    strExcel += '<Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/>';
	strExcel += '</Borders>';
	strExcel += '<Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Color="#000000" ss:Bold="1"/>';
	strExcel += '<NumberFormat ss:Format="Fixed"/>';
	strExcel += '</Style>';
	strExcel += '</Styles>';

	return strExcel;
}


const downloadFileInBrowser = (blobFile, extension) => {
	let link = document.createElement("a");
	link.href = window.URL.createObjectURL(blobFile);
	link.setAttribute("download", "FlujoEfectivo" + extension);
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