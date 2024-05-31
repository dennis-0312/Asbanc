/**
*
* Task          Date            Author                                         Remarks
* GAP 47        28 Jun 2023     Alexander Ruesta <aruesta@myevol.biz>          - Crear vista al Estado de Resultado Gerencial.
*
*/

let GLOBAL = {},
	GLOBALKEY = {
		"getTransactions":{
			"end":false
		},
		"getRecordOne":{
			"end":false
		},
		"getRecordTwo":{
			"end":false
		},
		"getAccount":{
			"end":false
		}
	},
	DATAPRINT = [];
jQuery(document).ready(function () {
	let data = getParametres();
	if ((data.custpage_from != null && data.custpage_from != '' && data.custpage_to != null && data.custpage_to != '') || (data.custpage_period != null && data.custpage_period != '')) {
		nlapiSetFieldValue('custpage_htmlreport', setMessage('Cargando...'))
		
		
		let data = getParametres();
		data.suitelet = 'getTransactions';
		data.thread = 1;
		data.threads = 10;
		getInformation(data);

		let dataRecordOne = getParametres();
		dataRecordOne.suitelet = 'getRecordOne';
		dataRecordOne.thread = 1;
		dataRecordOne.threads = 10;
		getInformation(dataRecordOne);

		let dataRecordTwo = getParametres();
		dataRecordTwo.suitelet = 'getRecordTwo';
		dataRecordTwo.thread = 1;
		dataRecordTwo.threads = 10;
		getInformation(dataRecordTwo);

		let dataAccount = getParametres();
		dataAccount.suitelet = 'getAccount';
		dataAccount.thread = 1;
		dataAccount.threads = 10;
		getInformation(dataAccount);
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
		if (GLOBAL['getTransactions'].length == 0) {
			nlapiSetFieldValue('custpage_htmlreport', setMessage('No transactions!'))
			return;
		}

		let matchJsonOne = [],
			matchJsonTwo = [];
		let jsonSearch = GLOBAL['getTransactions'],
			recordJsonOne = GLOBAL['getRecordOne'],
			recordJsonTwo = GLOBAL['getRecordTwo'];	

		console.log('Get Transaction' + JSON.stringify(jsonSearch))
		console.log('Get Record One' + JSON.stringify(recordJsonOne))
		console.log('Get Record Two' + JSON.stringify(recordJsonTwo))
		for(let i in jsonSearch){
			for(let j in recordJsonOne){
				if(i ==j){
					jsonSearch[i].forEach(function(transaction){
						let auxJson = recordJsonOne[j].Range;
						//console.log('auxJSon' + JSON.stringify(auxJson))
						auxJson.forEach(function(line){
							//VALIDA LA FECHA
							let flag = getComparePeriods(line.DateInit, line.DateFin, transaction.Date);
							if(flag){
								line.Destination.forEach(function(lineDest){
									matchJsonOne.push({
										"Account": transaction.Account,
										"AccountName": transaction.AccountName,
										"Deparment": transaction.Deparment,
										"DeparmentName": transaction.DeparmentName,
										"SO": transaction.SO,
										"NDocument": transaction.NDocument,
										"DeparmentDestination": lineDest.DeparmentDest,
										"DeparmentDestName": lineDest.DeparmentDestName,
										"DepN1": transaction.N1,
										"DepN2": transaction.N2,
										"Date": transaction.Date,
										"Amount": Number(transaction.Amount) * (Number(lineDest.Percentage)),
										"EnlaceCuenta": transaction.EnlaceCuenta
									});
								})
							}	
						})
					})
				}
			}
		}
		console.log('Get Primer Match' +  JSON.stringify(matchJsonOne))

		matchJsonOne.forEach(function(transaction) {
			for(let i in recordJsonTwo){
				if(transaction.DeparmentDestination == i){
					let auxJson = recordJsonTwo[i].Range;
					auxJson.forEach(function(line){
						//VALIDA FECHA
						let flag = getComparePeriods(line.DateInit, line.DateFin, transaction.Date);
						if(flag){
							line.Destination.forEach(function(lineDest){
								matchJsonTwo.push({
									"Account":transaction.Account,
									"AccountName": transaction.AccountName,
									"Deparment":transaction.Deparment,
									"DeparmentName": transaction.DeparmentName,
									"DepN1": transaction.DepN1,
									"DepN2": transaction.DepN2,
									"SO":transaction.SO,
									"NDocument":transaction.NDocument,
									"DeparmentDestination": transaction.DeparmentDestination,
									"DeparmentDestName": transaction.DeparmentDestName,
									"DeparmentDestination2": lineDest.DeparmentDest,
									"DeparmentDestName2": lineDest.DeparmentDestName,
									"Date":transaction.Date,
									"DepDestN1": lineDest.N1,
									"DepDestN2": lineDest.N2,
									"DepDestN3": lineDest.N3,
									"DepDestN4": lineDest.N4,
									"Amount": Number(transaction.Amount) * (Number(lineDest.Percentage)),
									"EnlaceCuenta": transaction.EnlaceCuenta,
									"Repeat": false
								});
							})
						}
					})
				}
			}
		})

		console.log('ultimo' + JSON.stringify(GLOBAL['getAccount']));
	
		for (let i = 0; i < matchJsonTwo.length; i++) {
			for (let j = i+1; j < matchJsonTwo.length; j++) {
				if(matchJsonTwo[i].Account == matchJsonTwo[j].Account && matchJsonTwo[i].Deparment == matchJsonTwo[j].Deparment && matchJsonTwo[i].DeparmentDestination2 == matchJsonTwo[j].DeparmentDestination2 && !subline.Repeat){
					matchJsonTwo[i].Amount = matchJsonTwo[i].Amount + matchJsonTwo[j].Amount;
					matchJsonTwo[j].Repeat = true;
				}	
			}
		}

		/*var matchJsonTwo = [{
			"EnlaceCuenta": 1,
		},
		{
			"EnlaceCuenta": 2
		}
	]*/
		
		for (const key in GLOBAL['getAccount']) {
			//nivel 1
			GLOBAL['getAccount'][key].forEach(function(nivel2){
				// nivel 2
				
				nivel2.nivel3.forEach(function(nivel3){
					 // nivel 3
					let flag_3 = false;
					matchJsonTwo.forEach(function (line) {
						if(line.EnlaceCuenta == nivel3.id_3 && !line.Repeat){
							flag_3 = true;
						}
					})
					console.log(flag_3)
					if(!flag_3){
						console.log('Borro' +  nivel3)
						nivel2.nivel3.splice(nivel2.nivel3.indexOf(nivel3), 1);
					}
				})
				if(nivel2.nivel3.length == 0){
					GLOBAL['getAccount'][key].splice(GLOBAL['getAccount'][key].indexOf(nivel2), 1);
				}
			})
			
		}

			console.log(JSON.stringify(GLOBAL['getAccount']))
		
		
		let strTable = '', 
			headers =  ["Cuenta", "Departamento", "Orden de Servicio", "N° Documento", "Departamento Destino", "Fecha", "Importe", "N1", "N2", "N3", "N4", "N1", "N2"],
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
		
		
			for (const key in GLOBAL['getAccount']) {
				if(GLOBAL['getAccount'][key].length != 0){
					var row = getRowN(key, key, '');
					strTable += row.table; //nivel 1
					DATAPRINT.push(row.row)
					GLOBAL['getAccount'][key].forEach(function(nivel2){
						var row = getRowN(nivel2.nivel2, nivel2.nivel2, key);
						strTable += row.table; // nivel 2
						DATAPRINT.push(row.row)
						nivel2.nivel3.forEach(function(nivel3){
							var row = getRowN(nivel3.name_3, nivel3.id_3, nivel2.nivel2);
							strTable += row.table; // nivel 3
							DATAPRINT.push(row.row)
							matchJsonTwo.forEach(function (line) {
								if(line.EnlaceCuenta == nivel3.id_3 && !line.Repeat){
									var row = getRow(line, null, nivel3.id_3, 0);
									strTable += row.table; // nivel 4
									DATAPRINT.push(row.row)
								}
							})
						})
					})
				}
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

const getRow = (GroupFields, key, parent, group) => {
	let strTable = '',
		thisJson = {};
	parent = parent || ''
	key = key || ''
	strTable += '<tr data-tt-id="' + key + '" data-tt-parent-id="' + parent + '" class="group' + group + '">';
	
	
	//Cuenta
	strTable += '<td>';
	thisJson.Account = GroupFields.AccountName || '';
	strTable += thisJson.Account;
	strTable += '</td>';

	//Departamento
	 strTable += '<td>';
	 thisJson.Deparment = GroupFields.DeparmentName || '';
	 strTable += thisJson.Deparment;
	 strTable += '</td>';	

	//Orden de Servicio
	strTable += '<td>';
	thisJson.SO = GroupFields.SO || '';
	strTable += thisJson.SO;
	strTable += '</td>';

	//Número de Documento
	strTable += '<td>';
	thisJson.NDocument = GroupFields.NDocument || '';
	strTable += thisJson.NDocument;
	strTable += '</td>';

	//Departamento Destino 2
	strTable += '<td>';
	thisJson.DeparmentDestName2 = GroupFields.DeparmentDestName2 || '';
	strTable += thisJson.DeparmentDestName2;
	strTable += '</td>';

	//Fecha
	strTable += '<td>';
	thisJson.Date = GroupFields.Date || '';
	strTable += thisJson.Date;
	strTable += '</td>';

	//Importe
	strTable += '<td class="number">';
	thisJson.Amount = GroupFields.Amount || '';
	strTable += thisJson.Amount;
	strTable += '</td>';

	// Dep Dest N1
	strTable += '<td>';
	thisJson.DepDestN1 = GroupFields.DepDestN1 || '';
	strTable += thisJson.DepDestN1;
	strTable += '</td>';

	// Dep Dest N2
	strTable += '<td>';
	thisJson.DepDestN2 = GroupFields.DepDestN2 || '';
	strTable += thisJson.DepDestN2;
	strTable += '</td>';

	// Dep Dest N3
	strTable += '<td>';
	thisJson.DepDestN3 = GroupFields.DepDestN3 || '';
	strTable += thisJson.DepDestN3;
	strTable += '</td>';

	// Dep Dest N4
	strTable += '<td>';
	thisJson.DepDestN4 = GroupFields.DepDestN4 || '';
	strTable += thisJson.DepDestN4;
	strTable += '</td>';

	// Dep N1
	strTable += '<td>';
	thisJson.DepN1 = GroupFields.DepN1|| '';
	strTable += thisJson.DepN1;
	strTable += '</td>';

	// Dep N2
	strTable += '<td>';
	thisJson.DepN2 = GroupFields.DepN2 || '';
	strTable += thisJson.DepN2;
	strTable += '</td>';

	thisJson.Group = 1;

	strTable += '</tr>';
	return {
		table: strTable,
		row: thisJson
	}
}

const getRowN = (paramName, key, parent) => {
	let strTable = '',
		thisJson = {};
	parent = parent || ''
	key = key || ''
	strTable += '<tr data-tt-id="' + key + '" data-tt-parent-id="' + parent + '">';
	
	
	//Cuenta
	strTable += '<td>';
	thisJson.AccountName = paramName || '';
	strTable += thisJson.AccountName;
	strTable += '</td>';

	thisJson.Group = 0;
	 
	strTable += '</tr>';
	return {
		table: strTable,
		row: thisJson
	}
}

const setDataExcel = (paramResult, paramHeaders) => {
	let xmlString = getStyleExcel();
	xmlString += '<Worksheet ss:Name="Estado de Resultados">';
	xmlString += '<Table>';

	xmlString += '<Column ss:AutoFitWidth="0" ss:Width="150"/>';
	xmlString += '<Column ss:AutoFitWidth="0" ss:Width="500"/>';
	xmlString += '<Column ss:AutoFitWidth="0" ss:Width="150"/>';
	xmlString += '<Column ss:AutoFitWidth="0" ss:Width="150"/>';
	xmlString += '<Column ss:AutoFitWidth="0" ss:Width="150"/>';
	xmlString += '<Column ss:AutoFitWidth="0" ss:Width="150"/>';
	xmlString += '<Column ss:AutoFitWidth="0" ss:Width="150"/>';
	xmlString += '<Column ss:StyleID="s90" ss:AutoFitWidth="0" ss:Width="150"/>';
	xmlString += '<Column ss:AutoFitWidth="0" ss:Width="150"/>';
	xmlString += '<Column ss:AutoFitWidth="0" ss:Width="150"/>';
	xmlString += '<Column ss:AutoFitWidth="0" ss:Width="150"/>';
	xmlString += '<Column ss:AutoFitWidth="0" ss:Width="150"/>';
	xmlString += '<Column ss:AutoFitWidth="0" ss:Width="150"/>';
	xmlString += '<Column ss:AutoFitWidth="0" ss:Width="150"/>';
	xmlString += '<Column ss:AutoFitWidth="0" ss:Width="150"/>';

	//TITULO
	xmlString += '<Row/>';

	xmlString += '<Row>';
	xmlString += '<Cell/>';
	xmlString += '<Cell/>';
	xmlString += '<Cell/>';
	xmlString += '<Cell ss:MergeAcross="3" ss:StyleID="s63" ><Data ss:Type="String">Estado de Resultados</Data></Cell>';
	xmlString += '</Row>';
	
	xmlString += '<Row/><Row/>';

	xmlString += '<Row>';
	xmlString += '<Cell/>';
	paramHeaders.forEach(function(header){
		xmlString +=  '<Cell ss:StyleID="s78"><Data ss:Type="String">' + header + '</Data></Cell>';
	})
	xmlString += '</Row>';

	paramResult.forEach(element => {
		xmlString += '<Row>';
		if(element.Group == 0){
			xmlString += '<Cell ss:Index="2" ss:StyleID="s87"><Data ss:Type="String">' + element.AccountName + '</Data></Cell>';
		}else if(element.Group == 1){
			xmlString += '<Cell/>';
			xmlString += '<Cell ss:StyleID="s86"><Data ss:Type="String">' + element.Account + '</Data></Cell>';
			xmlString += '<Cell ss:StyleID="s86"><Data ss:Type="String">' + element.Deparment + '</Data></Cell>';
			xmlString += '<Cell ss:StyleID="s86"><Data ss:Type="String">' + element.SO + '</Data></Cell>';
			xmlString += '<Cell ss:StyleID="s86"><Data ss:Type="String">' + element.NDocument + '</Data></Cell>';
			xmlString += '<Cell ss:StyleID="s86"><Data ss:Type="String">' + element.DeparmentDestName2 + '</Data></Cell>';
			xmlString += '<Cell ss:StyleID="s86"><Data ss:Type="String">' + element.Date + '</Data></Cell>';
			xmlString += '<Cell><Data ss:Type="Number">' + element.Amount + '</Data></Cell>';
			xmlString += '<Cell ss:StyleID="s86"><Data ss:Type="String">' + element.DepDestN1 + '</Data></Cell>';
			xmlString += '<Cell ss:StyleID="s86"><Data ss:Type="String">' + element.DepDestN2 + '</Data></Cell>';
			xmlString += '<Cell ss:StyleID="s86"><Data ss:Type="String">' + element.DepDestN3 + '</Data></Cell>';
			xmlString += '<Cell ss:StyleID="s86"><Data ss:Type="String">' + element.DepDestN4 + '</Data></Cell>';
			xmlString += '<Cell ss:StyleID="s86"><Data ss:Type="String">' + element.DepN1 + '</Data></Cell>';
			xmlString += '<Cell ss:StyleID="s86"><Data ss:Type="String">' + element.DepN2 + '</Data></Cell>';
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
	link.setAttribute("download", "EERR" + extension);
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