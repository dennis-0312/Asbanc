/**
*
* Task          Date            Author                                         Remarks
* GAP 97        13 Ago 2023     Alexander Ruesta <aruesta@myevol.biz>          - Crear vista al Reporte Comparativo de Proveedores.
*
*/

let GLOBAL = {},
	GLOBALKEY = {
		"getRequest":{
			"end":false
		},
		"getRpt":{
			"end":false
		}
	},
	DATAPRINT = [],
	headers =  ["Nro. Solicitud de Cotización", "Nro. Respuesta", "Proveedor", "Articulo", "Cantidad", "Monto", "Tipo de Pago"];
jQuery(document).ready(function () {
	
	nlapiSetFieldValue('custpage_htmlreport', setMessage('Cargando...'))
		
		
		let data = getParametres();
		data.suitelet = 'getRequest';
		data.thread = 1;
		data.threads = 10;
		getInformation(data);

		let dataRpt = getParametres();
		dataRpt.suitelet = 'getRpt';
		dataRpt.thread = 1;
		dataRpt.threads = 10;
		getInformation(dataRpt);

	

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
		if (GLOBAL['getRequest'].length == 0) {
			nlapiSetFieldValue('custpage_htmlreport', setMessage('No hay transacciones!'))
			return;
		}

		let groups = [],
			jsonResult_1 = {},
			jsonResult_2 = {};
		groups[0] = alasql('SELECT internalID, tranID, rpt FROM ? GROUP BY internalID, tranID, rpt', [GLOBAL['getRequest']]);
		//groups[1] = alasql('SELECT ActividadID, Actividad, SubActividadID, SubActividad AS Name, 0 AS Amount, 0 AS AmountBefore FROM ? GROUP BY ActividadID, Actividad, SubActividadID, SubActividad', [GLOBAL['getRecord']]);
		
		groups[0].forEach(function(line){
			if(!jsonResult_1[line.internalID]){
				jsonResult_1[line.internalID] = {
					"tranID" : line.tranID,
					"response": [line.rpt]
				}
			}else{
				jsonResult_1[line.internalID].response.push(line.rpt)
			}
		})

		
		GLOBAL['getRpt'].forEach(function(line){
			let aux = line.internalID + '///' + line.item;
			if(!jsonResult_2[aux]){
				jsonResult_2[aux] = {
					"tranID": line.tranID,
					"vendorName": line.vendorID,
					"itemName": line.itemName,
					"response": [{
						"quantity": line.cantidad,
						"amount": line.precio,
						"payment": line.payment
					}]
				}
			}else{
				jsonResult_2[aux].response.push({
					"quantity": line.cantidad,
						"amount": line.precio,
						"payment": line.payment
				})
			}

		})



		console.log('MIRAME 1 - >>>' + JSON.stringify(jsonResult_1))
		console.log('MIRAME 2 - >>>' + JSON.stringify(jsonResult_2))

		let strTable = '', 
			replaceSimbol = new RegExp(/[^A-Za-z0-9]+/g);

		strTable += '<table id="main_table">';
		
		strTable += '<thead><tr>';
			headers.forEach(function (header) {
				strTable += '<td><b>' + header + '</b></td>'
			})
		strTable += '</tr></thead>';
		
		strTable += '<tfoot><tr>';
			headers.forEach(function (header) {
				strTable += '<td><b>' + header + '</b></td>'
			})
		strTable += '</tr></tfoot>';
		
		strTable += '<tbody>';
		
		for(var key in jsonResult_1){
			let primaryKey = key;
			var row = getRow(jsonResult_1[key], primaryKey, '', 1);
			strTable += row.table;
			DATAPRINT.push(row.row);
			jsonResult_1[key].response.forEach(function(nivel1){
				for(var key_1 in jsonResult_2){
					let secondKey = key_1;
					if(nivel1 == key_1.split('///')[0]){
						var row = getRow(jsonResult_2[key_1], secondKey, primaryKey, 2);
						strTable += row.table;
						DATAPRINT.push(row.row);
						let i = 0;
						jsonResult_2[key_1].response.forEach(function(nivel2){
							let thridKey = key_1 + i;
							var row = getRow(nivel2, thridKey, secondKey, 3);
							strTable += row.table;
							DATAPRINT.push(row.row);
							i++;
						})
					}
				}
			})
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
			printExcel()
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
	let strTable = '',
		thisJson = {};
	
	thisJson.Group = group;
	parent = parent || ''
	key = key || ''
	strTable += '<tr data-tt-id="' + key + '" data-tt-parent-id="' + parent + '" class="group' + group + '">';
	
	if(group == 1){
		//Cuenta
		strTable += '<td>';
		thisJson.Transaction = GroupFields.tranID || '';
		strTable += thisJson.Transaction;
		strTable += '</td>';
	}else if (group == 2){
		strTable += '<td/>';
		
		// Response
		strTable += '<td>';
		thisJson.TranID = GroupFields.tranID || '';
		strTable += thisJson.TranID;
		strTable += '</td>';	

		// Vendor
		strTable += '<td>';
		thisJson.Vendor = GroupFields.vendorName || '';
		strTable += thisJson.Vendor;
		strTable += '</td>';	

		// Item
		strTable += '<td>';
		thisJson.Item = GroupFields.itemName || '';
		strTable += thisJson.Item;
		strTable += '</td>';	
	}else{
		strTable += '<td/>';
		strTable += '<td/>';
		strTable += '<td/>';
		strTable += '<td/>';

		// Cantidad
		strTable += '<td>';
		thisJson.Quantity = GroupFields.quantity || '';
		strTable += thisJson.Quantity;
		strTable += '</td>';	
		
		// Monto
		strTable += '<td>';
		thisJson.Amount = GroupFields.amount || '';
		strTable += thisJson.Amount;
		strTable += '</td>';

		// Tipo de Pago
		strTable += '<td>';
		thisJson.Payment = GroupFields.payment || '';
		strTable += thisJson.Payment;
		strTable += '</td>';

	}

	


	strTable += '</tr>';
	return {
		table: strTable,
		row: thisJson
	}
}


const printExcel = () => {
	let xmlString = printStyleExcel();

	xmlString += '<Worksheet ss:Name="Reporte Proveedores">';
	xmlString += '<Table>';

	for (var i = 0; i < 20; i++) {
		xmlString += '<Column ss:AutoFitWidth="0" ss:Width="150"/>';
	}

	xmlString += '<Row/>';
	xmlString += '<Row/>';

	xmlString += '<Row>';
	xmlString += '<Cell></Cell>';
	headers.forEach(function(line){
		xmlString += '<Cell ss:StyleID="s83"><Data ss:Type="String">' + line + '</Data></Cell>';
	})
	xmlString += '</Row>';

	console.log(JSON.stringify(DATAPRINT))

	
	DATAPRINT.forEach(function(line){
		xmlString += '<Row>';
		if(line.Group == 1){
			xmlString += '<Cell></Cell>';
			xmlString += '<Cell ss:StyleID="s85"><Data ss:Type="String">' + line.Transaction + '</Data></Cell>';
		}else if(line.Group == 2){
			xmlString += '<Cell></Cell>';
			xmlString += '<Cell></Cell>';
			xmlString += '<Cell ss:StyleID="s85"><Data ss:Type="String">' + line.TranID + '</Data></Cell>';
			xmlString += '<Cell ss:StyleID="s85"><Data ss:Type="String">' + line.Vendor + '</Data></Cell>';
			xmlString += '<Cell ss:StyleID="s85"><Data ss:Type="String">' + line.Item + '</Data></Cell>';
		}else{
			xmlString += '<Cell></Cell>';
			xmlString += '<Cell></Cell>';
			xmlString += '<Cell></Cell>';
			xmlString += '<Cell></Cell>';
			xmlString += '<Cell></Cell>';
			xmlString += '<Cell ss:StyleID="s85"><Data ss:Type="String">' + line.Quantity + '</Data></Cell>';
			xmlString += '<Cell ss:StyleID="s85"><Data ss:Type="String">' + line.Amount + '</Data></Cell>';
			xmlString += '<Cell ss:StyleID="s85"><Data ss:Type="String">' + line.Payment + '</Data></Cell>';
		}
		xmlString += '</Row>';
	})
	


	/*for(var key in paramData){
		let flag = true;
		paramData[key].forEach(function(line){
			
			if(flag){
				xmlString += '<Row/>';
				xmlString += '<Row>';
				xmlString += '<Cell ss:Index="2" ss:StyleID="s86"><Data ss:Type="String">' + line.class+ '</Data></Cell>';
				xmlString += '<Cell ss:StyleID="s86"><Data ss:Type="String">' + line.department+ '</Data></Cell>';
				xmlString += '</Row>';
				flag = false;
			}
			xmlString += '<Row>';
			if(line.version == 'P5'){
				xmlString += '<Cell ss:Index="3" ss:StyleID="s85"><Data ss:Type="String">' + line.nameLine + '</Data></Cell>';
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
				xmlString += '<Cell ss:Index="3" ss:StyleID="s85"><Data ss:Type="String">' + line.version+ '</Data></Cell>';
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
	}*/

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
	link.setAttribute("download", "ReporteProveedores" + extension);
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