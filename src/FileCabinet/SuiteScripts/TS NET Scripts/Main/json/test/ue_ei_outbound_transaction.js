/**
 * @NApiVersion 2.1
 * @NScriptName E-Document Outbound Transaction UE
 * @NScriptId _edoc_sales_transaction_ue
 * @NScriptType usereventscript
 *
 * @NModuleScope Public
 */
define([
    "N/search",
    "../../app/audit/app_audit_manager",
    "N/runtime",
    "../../lib/translator",
    "../../app/einvoice/app_einvoice_license_manager",
    "N/redirect",
    "N/ui/serverWidget",
    "../../lib/app/app_transaction_type_map",
    "../../app/einvoice/app_einvoice_notifier",
    "N/error",
    "N/url",
    "../../app/einvoice/app_einvoice_outbound_certification",
    "require",
    "../../app/einvoice/app_einvoice_outbound_rendered_content_manager",
    "../../lib/constants",
    "../../app/einvoice/app_einvoice_free_country_check_helper",
    "../../app/einvoice/app_einvoice_permission_check_manager",
    "../../app/einvoice/app_einvoice_subsidiary_pref_getter",
], function (
    search,
    auditManager,
    runtime,
    translator,
    licenseManager,
    redirect,
    serverWidget,
    transactionMap,
    notifier,
    error,
    url,
    certification,
    require,
    contentManager,
    constants,
    freeCountryCheckHelper,
    permissionManager,
    subsidiaryPrefGetter
) {
    var EI_INBOUND_E_DOCUMENT = "custbody_psg_ei_inbound_edocument";
    var EI_INBOUND_PDF = "custbody_psg_ei_pdf";
    var EI_STATUS = "custbody_psg_ei_status";
    var EI_TEMPLATE = "custbody_psg_ei_template";
    var EI_CONTENT = "custbody_psg_ei_content";
    var EI_SENDING_METHOD = "custbody_psg_ei_sending_method";
    var EI_GENERATE_PDF = "custbody_edoc_gen_trans_pdf";
    var EI_GENERATED_PDF_FILE = "custbody_edoc_generated_pdf";
    var EI_CERTIFIED_EDOCUMENT = "custbody_psg_ei_certified_edoc";
    var EI_GENERATED_EDOCUMENT = "custbody_psg_ei_generated_edoc";
    var EI_EMAIL_RECIPIENT = "custbody_psg_ei_edoc_recipient";
    var ENTITY = "entity";
    var TXN_SUBSIDIARY = "subsidiary";
    var CUSTOMER = "customer";
    var CUSTOMER_PAYMENT = "customerpayment";
    var VENDOR_BILL = "vendorbill";
    var VENDOR_CREDIT = "vendorcredit";
    var ADMINISTRATOR = "administrator";
    var DIGITALLY_SIGNED_IDENTIFIER = "custbody_ei_ds_txn_identifier";
    var TRANSFER_ORDER = "transferorder";
    var FOR_GENERATION = "1";
    var READY_FOR_SENDING = "3";
    var GENERATION_FAILED = "5";
    var SENDING_FAILED = "8";
    var READY_FOR_CERTIFICATION = "19";
    var CERTIFICATION_DATA_ERROR = "21";
    var CERTIFICATION_IN_PROGRESS = "20";
    var CERTIFICATION_FAILED = "22";
    var SENT = "7";
    var CANCELLED = "17";
    var SYSTEM_USER = -4;
    var NO_LICENSE_CLIENT_MSG_CODE = "license.notinstalled";
    var NO_FREE_COUNTRY_MSG_CODE = "transaction.msg.nofreecountry";
    var TXN_COUNTRY_DIFFERENT_THAN_FREE_COUNTRY_MSG_CODE =
        "transaction.msg.txncountrydifferentthanfreecountry";
    var NO_LICENSE_CLIENT_CODE = "EI_NO_NSLC";
    var PREVIEW_DOWNLOAD_CHECK_SU_SCRIPT = "customscript_ei_content_service_su";
    var PREVIEW_DOWNLOAD_CHECK_SU_DEPLOY = "customdeploy_ei_content_service_su";
    var PREVIEW = "preview";
    var DOWNLOAD = "download";
    var EI_TEMPLATE_RECORD_TYPE = "customrecord_psg_ei_template";
    var EI_STATUS_FIELD = "custrecord_psg_ei_temp_edoc_status";
    var EDIT_TRANSACTION_RESTRICTED = "transaction.msg.blockededittransaction";
    var PACKAGE_FIELD = "custbody_psg_ei_trans_edoc_standard";
    var DIGITALLY_SIGNED_LABEL = "digitalSignature.identifierlabel";
    var QR_CODE_PREVIEW = "custbody_psg_ei_qr_code";
    var QR_CODE_STR_FLD = "custbody_psg_ei_qr_string";
    var NETWORK_REFERENCE_ID = "custbody_ei_network_id";
    var NETWORK_NAME = "custbody_ei_network_name";
    var NETWORK_STATUS = "custbody_ei_network_status";
    var NETWORK_UPDATED_DATE_TIME = "custbody_ei_network_updated_date_time";
    var SUBSIDIARY_PREFS_AUTOMATION_TYPE_FIELD =
        "custrecord_psg_ei_sub_edoc_automation";

    function beforeLoad(context) {
        var currRecord = context.newRecord;
        if (
            context.type === context.UserEventType.EDIT &&
            runtime.executionContext === runtime.ContextType.USER_INTERFACE
        ) {
            if (context.request.parameters.ei_process) {
                redirect.toRecord({
                    type: currRecord.type,
                    id: currRecord.id,
                    isEditMode: true,
                });
            }
        }
        /**
         * Check for the E-doc Status for blocking the EDIT of this transaction
         */
        if (
            context.type === context.UserEventType.EDIT ||
            context.type === context.UserEventType.XEDIT
        ) {
            checkAndPreventEditTransaction(currRecord);
        }

        //UI context check
        var isUI =
            runtime.executionContext === runtime.ContextType.USER_INTERFACE;
        if (isUI) {
            var eiTemplate = currRecord.getValue(EI_TEMPLATE);
            var transType = currRecord.type;
            var bannerMessage = "";
            var bannerType;
            var form = context.form;
            var userObj = runtime.getCurrentUser();
            var currRole = userObj.role;
            var currRoleId = userObj.roleId;
            var hasGenerationAccess = true;
            var hasSendingAccess = true;
            var hasCertifyAccess = true;
            var hasGetNetworkStatusAccess = true;
            var processEdocButton;
            var certSendingMethodId =
                certification.getCertSendingMethodId(currRecord);
            var certIsOff =
                typeof certSendingMethodId === "undefined" ||
                certSendingMethodId === "";
            var certIsOn = !certIsOff;
            var networkReferenceId = currRecord.getValue(NETWORK_REFERENCE_ID);
            if (currRoleId !== ADMINISTRATOR) {
                var permissions = permissionManager.getPermissions(currRole);
                var permissionResultsObj = JSON.parse(permissions);
                log.debug({
                    title: "Permission data",
                    details:
                        permissionResultsObj.hasGenerationAccess +
                        "\n" +
                        permissionResultsObj.hasCertificationAccess +
                        "\n" +
                        permissionResultsObj.hasSendingAccess +
                        "\n" +
                        permissionResultsObj.hasGetNetworkStatusAccess,
                });
                hasGenerationAccess = permissionResultsObj.hasGenerationAccess;
                hasSendingAccess = permissionResultsObj.hasSendingAccess;
                hasCertifyAccess = permissionResultsObj.hasCertificationAccess;
                hasGetNetworkStatusAccess =
                    permissionResultsObj.hasGetNetworkStatusAccess;
            }
            var isViewOrEdit =
                [
                    context.UserEventType.VIEW,
                    context.UserEventType.EDIT,
                ].indexOf(context.type) !== -1;
            if (currRecord.type === VENDOR_CREDIT) {
                hideGeneratedPDFField(context, currRecord);
            }
            else if (currRecord.type !== VENDOR_BILL) {
                hideInboundComponents(context);
                hideGeneratedPDFField(context, currRecord);
            }
            if (
                isEntitylessTransactionType(currRecord) &&
                (hasSendingAccess || hasGenerationAccess)
            ) {
                enableEdocPackageFields(context);
            }

            if (!isEntitylessTransactionType(currRecord)) {
                hideEmailRecipientField(context);
            }

            var showWarningMessage = false;

            //license check
            if (
                eiTemplate &&
                isViewOrEdit &&
                isUI === true &&
                (hasGenerationAccess || hasSendingAccess) &&
                !transactionMap.isCustomTransactionType(currRecord.type) // license check to be skipped for CTT
            ) {
                var licenseInfo = licenseManager.getLicenseInfo();
                if (!licenseInfo.hasLicense) {
                    var companyInfoCountry =
                        freeCountryCheckHelper.getValueOfAllowedFreeCountry();
                    var subsidiaryId = currRecord.getValue(TXN_SUBSIDIARY);
                    log.debug("subsidiaryId", subsidiaryId);
                    if (licenseInfo.errorCode === NO_LICENSE_CLIENT_CODE) {
                        showWarningMessage = true;
                        bannerMessage = translator.getString(
                            NO_LICENSE_CLIENT_MSG_CODE
                        );
                    } else if (freeCountryCheckHelper.isOwAccount()) {
                        if (
                            !companyInfoCountry ||
                            companyInfoCountry.length === 0
                        ) {
                            showWarningMessage = true;
                            bannerMessage = translator.getString(
                                NO_FREE_COUNTRY_MSG_CODE
                            );
                        } else {
                            if (
                                !freeCountryCheckHelper.ifFreeCountrySameAsInTxn(
                                    subsidiaryId
                                )
                            ) {
                                showWarningMessage = true;
                                bannerMessage = translator.getString(
                                    TXN_COUNTRY_DIFFERENT_THAN_FREE_COUNTRY_MSG_CODE
                                );
                            }
                        }
                    }
                    if (showWarningMessage) {
                        bannerType = "WARNING";
                    }
                    context.showWarningMessage = showWarningMessage;
                }
            }

            if (context.type === context.UserEventType.VIEW) {
                form.clientScriptModulePath = "../../comp/cs/cs_ei_transaction";
                var subsidiaryOfTxn = currRecord.getValue(TXN_SUBSIDIARY);
                var userPreferenceForEIP = getUserPrefForEIP(subsidiaryOfTxn);
                log.debug(
                    "EDoc Automation user prefs",
                    JSON.stringify(userPreferenceForEIP)
                );
                var isGCS = userPreferenceForEIP.isGCS;
                var isGC = userPreferenceForEIP.isGC;
                var isCS = userPreferenceForEIP.isCS;

                var eiStatus = currRecord.getValue(EI_STATUS);
                var buttonsForDisableCheck = [];

                if (!networkReferenceId) {
                    hideNetworkFields(form);
                }

                //adding EI Button: Generate
                if (eiStatus && eiTemplate) {
                    if (
                        hasGenerationAccess &&
                        isValidStatusForGenerateButton(eiStatus, certIsOn)
                    ) {
                        var GENERATE_EI_BUTTON_LABEL = translator.getString(
                            "invoice.generatebtn"
                        );
                        certSendingMethodId =
                            typeof certSendingMethodId === "undefined"
                                ? ""
                                : certSendingMethodId;
                        var generateButtonParams = {
                            id: "custpage_generate_ei_button",
                            label: GENERATE_EI_BUTTON_LABEL,
                            functionName:
                                "generate(" +
                                currRecord.id +
                                ",'" +
                                eiStatus +
                                "','" +
                                transType +
                                "','" +
                                certSendingMethodId +
                                "');",
                        };
                        var generateButton =
                            form.addButton(generateButtonParams);
                        buttonsForDisableCheck.push(generateButton);

                        //adding EI Button: Process E-Document
                        var addEIButton = false;
                        if (isGCS) {
                            if (
                                hasSendingAccess &&
                                (hasCertifyAccess || certIsOff)
                            ) {
                                addEIButton = true;
                            }
                        }

                        if (isGC) {
                            if (certIsOn && hasCertifyAccess) {
                                addEIButton = true;
                            }
                        }

                        if (addEIButton) {
                            processEdocButton =
                                addCombinedProcessesButton(context);
                            buttonsForDisableCheck.push(processEdocButton);
                        }
                    }

                    //banner message when reload is caused by a EI Process
                    var eiProcessBannerDetails = getBannerDetails(context);

                    if (eiProcessBannerDetails.bannerMessage) {
                        bannerMessage = eiProcessBannerDetails.bannerMessage;
                        bannerType = eiProcessBannerDetails.bannerType;
                    }
                }

                //adding EI Button: Send
                if (
                    hasSendingAccess &&
                    (eiStatus === READY_FOR_SENDING ||
                        eiStatus === SENDING_FAILED)
                ) {
                    //only show Send E-Invoice button if the status is Ready for Sending or Sending Failed
                    var SEND_EI_BUTTON_LABEL =
                        translator.getString("invoice.sendbtn");
                    var sendButtonParams = {
                        id: "custpage_send_ei_button",
                        label: SEND_EI_BUTTON_LABEL,
                        functionName:
                            "send(" +
                            currRecord.id +
                            ",'" +
                            transType +
                            "','');",
                    };
                    var sendButton = form.addButton(sendButtonParams);
                    buttonsForDisableCheck.push(sendButton);
                }

                //adding EI Button: Certify
                if (
                    hasCertifyAccess &&
                    certIsOn &&
                    isValidStatusForCertifyButton(eiStatus)
                ) {
                    var SEND_CERTIFY_EI_BUTTON_LABEL = translator.getString(
                        "invoice.sendcertifybtn"
                    );
                    var sendCertifyButtonParams = {
                        id: "custpage_send_certify_ei_button",
                        label: SEND_CERTIFY_EI_BUTTON_LABEL,
                        functionName:
                            "send(" +
                            currRecord.id +
                            ",'" +
                            transType +
                            "'," +
                            certSendingMethodId +
                            ");",
                    };
                    var sendCertifyButton = form.addButton(
                        sendCertifyButtonParams
                    );
                    buttonsForDisableCheck.push(sendCertifyButton);

                    //adding EI Button: processEdocButton
                    if (isCS) {
                        if (hasSendingAccess) {
                            processEdocButton =
                                addCombinedProcessesButton(context);
                            buttonsForDisableCheck.push(processEdocButton);
                        }
                    }
                }

                //add EI Button: Get Network Status
                if (networkReferenceId && hasGetNetworkStatusAccess && eiStatus !== CANCELLED) {
                    var GET_NETWORK_STATUS_BUTTON_LABEL = translator.getString(
                        "invoice.get.network.status.btn"
                    );
                    var getNetworkStatusButtonParams = {
                        id: "custpage_get_network_status_ei_button",
                        label: GET_NETWORK_STATUS_BUTTON_LABEL,
                        functionName:
                            "getNetworkStatus(" +
                            currRecord.id +
                            ",'" +
                            transType +
                            "','" +
                            certSendingMethodId +
                            "');",
                    };
                    var networkStatusButton = form.addButton(
                        getNetworkStatusButtonParams
                    );
                    buttonsForDisableCheck.push(networkStatusButton);
                }

                //disabling buttons if applicable
                var disableParams = {
                    showWarningMessage: showWarningMessage,
                    currRecord: currRecord,
                };
                disableButtons(buttonsForDisableCheck, disableParams);

                var xmlContent = currRecord.getValue(EI_CONTENT);
                var extension;
                if (xmlContent) {
                    try {
                        extension =
                            contentManager.getExtensionForEdocContentOfTxn(
                                currRecord
                            );
                    } catch (e) {
                        log.error(
                            "Error in getExtensionForEdocContentOfTxn",
                            e.message + "\n" + e.stack
                        );
                        extension = "xml";
                    }
                    var generatedDate = getGeneratedDate(
                        currRecord,
                        certSendingMethodId
                    );
                    var previewParams = {
                        edocId: currRecord.id,
                        fileFormat: extension,
                        doctype: "outbound",
                        type: currRecord.type,
                        command: PREVIEW,
                    };
                    var previewUrl = url.resolveScript({
                        scriptId: PREVIEW_DOWNLOAD_CHECK_SU_SCRIPT,
                        deploymentId: PREVIEW_DOWNLOAD_CHECK_SU_DEPLOY,
                        params: previewParams,
                    });
                    var downloadParams = {
                        edocId: currRecord.id,
                        fileFormat: extension,
                        doctype: "outbound",
                        type: currRecord.type,
                        genDate: generatedDate,
                        command: DOWNLOAD,
                    };
                    var downloadUrlVal = url.resolveScript({
                        scriptId: PREVIEW_DOWNLOAD_CHECK_SU_SCRIPT,
                        deploymentId: PREVIEW_DOWNLOAD_CHECK_SU_DEPLOY,
                        params: downloadParams,
                    });
                    var linkTextParams = {
                        urlVal: previewUrl,
                        currRecord: currRecord,
                        generatedDate: generatedDate,
                        extension: extension,
                        downloadUrlVal: downloadUrlVal,
                    };
                    var getRichText =
                        contentManager.getLinkRichText(linkTextParams);
                    form.updateDefaultValues({
                        custbody_psg_ei_generated_edoc: getRichText,
                    });
                }
                var certifiedXMLField = form.getField({
                    id: EI_CERTIFIED_EDOCUMENT,
                });
                if (
                    certSendingMethodId === "" ||
                    typeof certSendingMethodId === "undefined"
                ) {
                    certifiedXMLField.updateDisplayType({
                        displayType: serverWidget.FieldDisplayType.HIDDEN,
                    });
                }
                /**
                 * If the current record is digitally signed, show the Digital Signature label else show nothing
                 */
                var isDigitallySigned = currRecord.getValue(
                    DIGITALLY_SIGNED_IDENTIFIER
                );
                if (isDigitallySigned === true)
                    form.updateDefaultValues({
                        custbody_psg_ei_digitalsignature_label:
                            "<p>" +
                            translator.getString(DIGITALLY_SIGNED_LABEL) +
                            "</p>",
                    });
                else
                    form.updateDefaultValues({
                        custbody_psg_ei_digitalsignature_label: "<p> </p>",
                    });
            } else if (
                [
                    context.UserEventType.CREATE,
                    context.UserEventType.TRANSFORM,
                ].indexOf(context.type) !== -1
            ) {
                currRecord.setValue(EI_STATUS, "");
                currRecord.setValue(EI_TEMPLATE, "");
                currRecord.setValue(EI_SENDING_METHOD, "");
                currRecord.setValue(EI_GENERATED_PDF_FILE, "");
                currRecord.setValue(EI_GENERATED_EDOCUMENT, "");
                currRecord.setValue(EI_CERTIFIED_EDOCUMENT, "");
                currRecord.setValue(EI_CONTENT, "");
                currRecord.setValue(DIGITALLY_SIGNED_IDENTIFIER, false);
                resetQRFields(form, currRecord);
                resetNetworkFields(form, currRecord);
            } else if (context.type === context.UserEventType.COPY) {
                currRecord.setValue(EI_STATUS, "");
                currRecord.setValue(EI_GENERATED_PDF_FILE, "");
                currRecord.setValue(EI_GENERATED_EDOCUMENT, "");
                currRecord.setValue(EI_CERTIFIED_EDOCUMENT, "");
                currRecord.setValue(EI_CONTENT, "");
                currRecord.setValue(DIGITALLY_SIGNED_IDENTIFIER, false);
                resetQRFields(form, currRecord);
                resetNetworkFields(form, currRecord);
            }
            if (context.type === context.UserEventType.VIEW) {
                hideQRCodeField(context);
            }
            if (bannerMessage !== "") {
                showResultMessage(form, currRecord, bannerType, bannerMessage);
            }
        }
    }

    function resetQRFields(form, currRecord) {
        var qrCodePreviewFld = form.getField({
            id: QR_CODE_PREVIEW,
        });
        if (qrCodePreviewFld) {
            currRecord.setValue(QR_CODE_PREVIEW, "");
        }
        var qrCodeStrFld = form.getField({
            id: QR_CODE_STR_FLD,
        });
        if (qrCodeStrFld) {
            currRecord.setValue(QR_CODE_STR_FLD, "");
        }
    }

    function resetNetworkFields(form, currRecord) {
        var networkReferenceIdField = form.getField({
            id: NETWORK_REFERENCE_ID,
        });
        if (networkReferenceIdField) {
            currRecord.setValue(NETWORK_REFERENCE_ID, "");
        }
        var networkNameField = form.getField({
            id: NETWORK_NAME,
        });
        if (networkNameField) {
            currRecord.setValue(NETWORK_NAME, "");
        }
        var networkStatusField = form.getField({
            id: NETWORK_STATUS,
        });
        if (networkStatusField) {
            currRecord.setValue(NETWORK_STATUS, "");
        }
        var networkUpdatedDateTimeField = form.getField({
            id: NETWORK_UPDATED_DATE_TIME,
        });
        if (networkUpdatedDateTimeField) {
            currRecord.setValue(NETWORK_UPDATED_DATE_TIME, "");
        }
    }

    function isValidStatusForGenerateButton(eiStatus, certIsOn) {
        var VALID_STATUSES_FOR_GENERATE_CERT_ON = [
            FOR_GENERATION,
            GENERATION_FAILED,
            READY_FOR_CERTIFICATION,
            CERTIFICATION_DATA_ERROR,
        ];

        var VALID_STATUSES_FOR_GENERATE_CERT_OFF = [
            FOR_GENERATION,
            GENERATION_FAILED,
            READY_FOR_SENDING,
            SENDING_FAILED,
            SENT,
        ];

        if (certIsOn) {
            return VALID_STATUSES_FOR_GENERATE_CERT_ON.indexOf(eiStatus) != -1;
        } else {
            return VALID_STATUSES_FOR_GENERATE_CERT_OFF.indexOf(eiStatus) != -1;
        }
    }

    function isValidStatusForCertifyButton(eiStatus) {
        var VALID_STATUSES_FOR_CERTIFY_BTN = [
            READY_FOR_CERTIFICATION,
            CERTIFICATION_FAILED,
        ];
        return VALID_STATUSES_FOR_CERTIFY_BTN.indexOf(eiStatus) != -1;
    }

    function getBannerDetails(context) {
        var bannerType = "";
        var bannerMessage = "";
        var requestParameters = context.request.parameters;
        if (requestParameters.ei_process) {
            var eiProcess = requestParameters.ei_process; //origin CS > here
            var messageCode = requestParameters.ei_mc; //origin generationSU > CS > here

            var type = requestParameters.ei_t;
            var cmid = requestParameters.cmid;
            /* Determining banner type */
            if (!type || type === "c") {
                bannerType = "CONFIRMATION";
            } else if (type === "e") {
                bannerType = "ERROR";
            } else if (type === "w") {
                bannerType = "WARNING";
            } else if (type === "i") {
                bannerType = "INFORMATION";
            }
            if (eiProcess && !cmid) {
                /* Translation and showing of banner */
                bannerMessage = translator.getString(messageCode);
            }
        }
        return {
            bannerMessage: bannerMessage,
            bannerType: bannerType,
        };
    }

    function isMemorizedTxn(currRecord) {
        return (
            (currRecord.id === "" || currRecord.id == null) &&
            currRecord.type != null
        );
    }

    function disableButtons(buttons, params) {
        if (!buttons) {
            return;
        }
        var warningIsDisplayed = params.showWarningMessage;
        var memorized = isMemorizedTxn(params.currRecord);
        buttons.forEach(function (button) {
            if (warningIsDisplayed) {
                button.isDisabled = true;
            }
            if (memorized) {
                button.isDisabled = true;
            }
        });
    }

    function addCombinedProcessesButton(context) {
        var form = context.form;
        var currRecord = context.newRecord;
        var eiStatus = currRecord.getValue(EI_STATUS);
        var transType = currRecord.type;
        var certSendingMethodId =
            certification.getCertSendingMethodId(currRecord);
        var EIP_BUTTON_LABEL =
            translator.getString("invoice.eipbtn") || "Process E-Document";

        var processEdocButtonParams = {
            id: "custpage_eip_button",
            label: EIP_BUTTON_LABEL,
            functionName:
                "processEdoc(" +
                currRecord.id +
                ",'" +
                eiStatus +
                "','" +
                transType +
                "'," +
                certSendingMethodId +
                ");",
        };
        return form.addButton(processEdocButtonParams);
    }

    function getUserPrefForEIP(subsidiaryofTxn) {
        var isGCS = false;
        var isGC = false;
        var isCS = false;

        var subsidiaryFieldScriptIds = [SUBSIDIARY_PREFS_AUTOMATION_TYPE_FIELD];
        var subsidiaryPreferencesObj =
            subsidiaryPrefGetter.getSubsidiaryPreferencesFieldValues(
                subsidiaryofTxn,
                subsidiaryFieldScriptIds
            );
        var automaticEIPref =
            subsidiaryPreferencesObj[SUBSIDIARY_PREFS_AUTOMATION_TYPE_FIELD];
        switch (automaticEIPref) {
            case constants.EdocAutomationMode.GCS:
                isGCS = true;
                break;
            case constants.EdocAutomationMode.GC:
                isGC = true;
                break;
            case constants.EdocAutomationMode.CS:
                isCS = true;
                break;
        }
        return {
            isGCS: isGCS,
            isGC: isGC,
            isCS: isCS,
        };
    }

    function isEntitylessTransactionType(currRecord) {
        return (
            currRecord.type === TRANSFER_ORDER ||
            transactionMap.isBasicStyleCTT(currRecord.type) ||
            transactionMap.isJournalStyleCTT(currRecord.type)
        );
    }

    function getGeneratedDate(rec, certSendingMethodId) {
        var generatedDate;
        var RECORD_TYPE = "customrecord_psg_ei_audit_trail";
        var statusVal =
            typeof certSendingMethodId !== "undefined" &&
                certSendingMethodId !== ""
                ? READY_FOR_CERTIFICATION
                : READY_FOR_SENDING;
        var recId = rec.id;
        var TRANSACTION_FLD = "custrecord_psg_ei_audit_transaction";
        var EVENT_FIELD = "custrecord_psg_ei_audit_event";
        var columns = ["created"];
        var filters = [];
        filters.push([EVENT_FIELD, search.Operator.IS, statusVal]);
        filters.push("AND");
        filters.push([TRANSACTION_FLD, search.Operator.IS, recId]);
        var auditSearch = search.create({
            type: RECORD_TYPE,
            columns: columns,
            filters: filters,
        });
        auditSearch.run().each(function (sendingAudit) {
            generatedDate = sendingAudit.getValue("created");
            return true;
        });
        return generatedDate;
    }
    /**
     * Function to hide Inbound fields/components
     *
     * @param {Object} context Context object
     */
    function hideInboundComponents(context) {
        var form = context.form;
        var INBOUND_FIELDS = [EI_INBOUND_E_DOCUMENT, EI_INBOUND_PDF];
        for (var i = 0; i < INBOUND_FIELDS.length; i++) {
            var fieldname = INBOUND_FIELDS[i];
            var field = form.getField(fieldname);
            if (field) {
                field.updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.HIDDEN,
                });
            }
        }
    }

    function hideEmailRecipientField(context) {
        var form = context.form;
        var field = form.getField(EI_EMAIL_RECIPIENT);
        if (field) {
            field.updateDisplayType({
                displayType: serverWidget.FieldDisplayType.HIDDEN,
            });
        }
    }

    function hideGeneratedPDFField(context, currRecord) {
        var form = context.form;
        var generatePDF = currRecord.getValue(EI_GENERATE_PDF);
        var generatedPDF = currRecord.getValue(EI_GENERATED_PDF_FILE);
        if (
            !generatePDF &&
            (generatedPDF === "" || generatedPDF === "undefined")
        ) {
            var generatedPDFField = form.getField(EI_GENERATED_PDF_FILE);
            var generatePDFField = form.getField(EI_GENERATE_PDF);
            if (generatedPDFField) {
                generatedPDFField.updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.HIDDEN,
                });
                if (currRecord.type === VENDOR_CREDIT) {
                    generatePDFField.updateDisplayType({
                        displayType: serverWidget.FieldDisplayType.HIDDEN,
                    });
                }
            }
        }
    }

    function enableEdocPackageFields(context) {
        try {
            var form = context.form;
            var EDOC_FIELDS = [PACKAGE_FIELD];
            for (var i = 0; i < EDOC_FIELDS.length; i++) {
                var fieldname = EDOC_FIELDS[i];
                var field = form.getField(fieldname);
                if (field) {
                    field.updateDisplayType({
                        displayType: serverWidget.FieldDisplayType.NORMAL,
                    });
                }
            }
        } catch (ex) {
            log.error(
                "enableEdocPackageFields : Error",
                ex.message + "\n" + ex.stack
            );
        }
    }

    function shouldEiStatusBeResetOnTransactionModification(
        eiTemplate,
        forGenerationStatus,
        currentStatus
    ) {
        if (!eiTemplate) return false;
        if (!forGenerationStatus) return false;

        var STATUS_THAT_CANT_BE_RESET_ON_RECORD_UPDATE = [
            READY_FOR_SENDING,
            CERTIFICATION_DATA_ERROR,
            CERTIFICATION_IN_PROGRESS,
            CERTIFICATION_FAILED,
            SENT,
            SENDING_FAILED,
            CANCELLED,
        ];

        return (
            STATUS_THAT_CANT_BE_RESET_ON_RECORD_UPDATE.indexOf(
                currentStatus
            ) === -1
        );
    }

    // If QR Code base 64 value is empty, hide the QR Code preview.
    function hideQRCodeField(context) {
        var currRecord = context.newRecord;
        var qrPreviewValue = currRecord.getValue(QR_CODE_PREVIEW);
        log.debug("qr code preview value", qrPreviewValue);

        if (!qrPreviewValue) {
            var form = context.form;
            var qrCodeField = form.getField(QR_CODE_PREVIEW);

            if (qrCodeField) {
                qrCodeField.updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.HIDDEN,
                });
            }
        }
    }

    function hideNetworkFields(form) {
        var networkReferenceIdField = form.getField({
            id: NETWORK_REFERENCE_ID,
        });
        if (networkReferenceIdField) {
            networkReferenceIdField.updateDisplayType({
                displayType: serverWidget.FieldDisplayType.HIDDEN,
            });
        }

        var networkNameField = form.getField({
            id: NETWORK_NAME,
        });
        if (networkNameField) {
            networkNameField.updateDisplayType({
                displayType: serverWidget.FieldDisplayType.HIDDEN,
            });
        }

        var networkStatusField = form.getField({
            id: NETWORK_STATUS,
        });
        if (networkStatusField) {
            networkStatusField.updateDisplayType({
                displayType: serverWidget.FieldDisplayType.HIDDEN,
            });
        }

        var networkUpdatedDateTimeField = form.getField({
            id: NETWORK_UPDATED_DATE_TIME,
        });
        if (networkUpdatedDateTimeField) {
            networkUpdatedDateTimeField.updateDisplayType({
                displayType: serverWidget.FieldDisplayType.HIDDEN,
            });
        }
    }

    function beforeSubmit(context) {
        if (context.type !== context.UserEventType.DELETE) {
            var currRecord = context.newRecord;
            var oldRecord = context.oldRecord;
            var currUser = runtime.getCurrentUser();
            var entity;
            var eiTemplate;
            var currentStatus;
            var entityField =
                currRecord.type === CUSTOMER_PAYMENT ? CUSTOMER : ENTITY;
            if (context.type === context.UserEventType.XEDIT) {
                entity = getFieldValue(entityField, oldRecord, currRecord);
                eiTemplate = getFieldValue(EI_TEMPLATE, oldRecord, currRecord);
                currentStatus = getFieldValue(EI_STATUS, oldRecord, currRecord);
            } else {
                entity = currRecord.getValue(entityField);
                eiTemplate = currRecord.getValue(EI_TEMPLATE);
                currentStatus = currRecord.getValue(EI_STATUS);
            }
            var forGenerationStatus = isForGenerationStatus(currRecord);
            var certSendingMethodId;
            if (context.type !== context.UserEventType.CREATE)
                certSendingMethodId =
                    certification.getCertSendingMethodId(oldRecord);

            //in before submit, resets EI Status back to "For Generation" if
            //current status is not SENT and record is updated (in case of no certification)
            //current status is not one of the list, and record gets updated (in case of certification)
            if (certSendingMethodId) {
                if (
                    shouldEiStatusBeResetOnTransactionModification(
                        eiTemplate,
                        forGenerationStatus,
                        currentStatus
                    )
                ) {
                    currRecord.setValue(EI_STATUS, FOR_GENERATION);
                }
            } else {
                if (
                    eiTemplate &&
                    forGenerationStatus &&
                    currentStatus !== SENT &&
                    currentStatus !== CANCELLED
                ) {
                    currRecord.setValue(EI_STATUS, FOR_GENERATION);
                }
            }
            var user = currUser.id;
            if (user === SYSTEM_USER) {
                user = notifier.getFirstActiveAdmin();
            }
            var oldEITemplate = oldRecord
                ? oldRecord.getValue(EI_TEMPLATE)
                : "";
            if (!eiTemplate && oldEITemplate) {
                if (currentStatus !== SENT) {
                    if (
                        entity !== null &&
                        typeof entity !== "undefined" &&
                        entity !== ""
                    )
                        entity = checkIfInactiveEntity(entity);
                    currRecord.setValue(EI_STATUS, "");
                    auditManager.logUntagged({
                        transaction: currRecord.id,
                        entity: entity,
                        owner: user,
                        details: translator.getString("invoice.loguntagged"),
                    });
                } else {
                    if (
                        runtime.executionContext !==
                        runtime.ContextType.USER_INTERFACE
                    ) {
                        var errorMsg = error.create({
                            name: "EI_CANNOT_REMOVE_TEMPLATE",
                            message: translator.getString(
                                "transaction.msg.removetemplatealreadysent"
                            ),
                            notifyOff: true,
                        });
                        throw new Error(
                            errorMsg.name + ": " + errorMsg.message
                        );
                    }
                }
            }
        }
        /**
         * Check for the E-doc Status for blocking the EDIT of this transaction
         *
         */
        if (
            context.type === context.UserEventType.EDIT ||
            context.type === context.UserEventType.XEDIT
        ) {
            checkAndPreventEditTransaction(oldRecord);
        }
    }

    function afterSubmit(context) {
        var currRecord = context.newRecord;
        var oldRecord = context.oldRecord;
        var currUser = runtime.getCurrentUser();
        var entity;
        var eiTemplate;
        var eiStatus;
        var entityField =
            currRecord.type === CUSTOMER_PAYMENT ? CUSTOMER : ENTITY;
        if (context.type === context.UserEventType.XEDIT) {
            entity = getFieldValue(entityField, oldRecord, currRecord);
            eiTemplate = getFieldValue(EI_TEMPLATE, oldRecord, currRecord);
            eiStatus = getFieldValue(EI_STATUS, oldRecord, currRecord);
        } else {
            entity = currRecord.getValue(entityField);
            eiTemplate = currRecord.getValue(EI_TEMPLATE);
            eiStatus = currRecord.getValue(EI_STATUS);
        }
        var user = currUser.id;
        if (user === SYSTEM_USER) {
            user = notifier.getFirstActiveAdmin();
        }
        var isAlreadyForGeneration = isAlreadySetForGeneration(oldRecord);
        if (
            eiTemplate &&
            eiStatus === FOR_GENERATION &&
            !isAlreadyForGeneration
        ) {
            if (
                entity !== null &&
                typeof entity !== "undefined" &&
                entity !== ""
            )
                entity = checkIfInactiveEntity(entity);
            auditManager.logForGenerate({
                transaction: currRecord.id,
                entity: entity,
                owner: user,
                details: translator.getString("invoice.logforgenerate"),
            });
        }
    }
    /**
     * Checks if record's status is already 'For Generation'
     *
     * @param {Object} oldRecord Old record object
     * @returns {Boolean}
     */
    function isAlreadySetForGeneration(oldRecord) {
        var flag = false;
        if (oldRecord && oldRecord.getValue(EI_STATUS) === FOR_GENERATION) {
            flag = true;
        }
        return flag;
    }
    /**
     * Gets the Field Value from new or old record
     *
     * @param {String} fieldId Field Id
     * @param {Object} oldRecord Old record object
     * @param {Object} newRecord New record object
     * @returns {*}
     */
    function getFieldValue(fieldId, oldRecord, newRecord) {
        var value;
        var modifiedFields = newRecord.getFields();
        /* old record always contains all field values */
        /* new record only contains field values that are subjected to xedit */
        /* behavior is the same in beforeSubmit and afterSubmit */
        if (modifiedFields.indexOf(fieldId) !== -1) {
            value = newRecord.getValue(fieldId);
        } else {
            value = oldRecord.getValue(fieldId);
        }
        return value;
    }
    /**
     * if status changes are from the generation and sending services
     *
     * @param {Object} currRecord Current Record Object
     * @returns {Boolean}
     */
    function isForGenerationStatus(currRecord) {
        var forGeneration = true;
        if (
            runtime.executionContext === runtime.ContextType.SUITELET ||
            runtime.executionContext === runtime.ContextType.MAP_REDUCE ||
            runtime.executionContext === runtime.ContextType.USEREVENT
        ) {
            /*
             * Generation Service updates the following fields:
             * - CUSTBODY_PSG_EI_CONTENT
             * - CUSTBODY_PSG_EI_STATUS
             *
             * Sending Service updates a single field:
             * - CUSTBODY_PSG_EI_STATUS
             *
             * UI context contents all the the fields in the current record.
             * This is why Map/Reduce and Suitelet is included in the condition
             *
             * */
            var currStatus = currRecord.getValue(EI_STATUS);
            var currXML = currRecord.getValue(EI_CONTENT);
            if (currStatus || currXML) {
                forGeneration = false;
            }
        }
        return forGeneration;
    }
    /**
     * Function checks if the customer/vendor is active, if not, will return "".
     * This is for audit trail logging purposes when customer/vendor is inactive
     *
     * @param {String} entityId Entity Id
     * @returns {String}
     */
    function checkIfInactiveEntity(entityId) {
        var result = search.lookupFields({
            type: search.Type.ENTITY,
            id: entityId,
            columns: "isinactive",
        });
        var isInactive = result.isinactive;
        return isInactive ? "" : entityId;
    }
    /**
     * Show the result of generation or sending of E-Document
     * @param {Object} form Server Widget Form Object
     * @param {Object} currRecord Current Record Object
     * @param {String} bannerType Indicates the type of banner
     * @param {String} bannerMessage The message to show in the banner
     */
    function showResultMessage(form, currRecord, bannerType, bannerMessage) {
        require(["N/ui/message"], function (message) {
            var messageType;
            if (bannerType === "CONFIRMATION") {
                messageType = message.Type.CONFIRMATION;
            } else if (bannerType === "WARNING") {
                messageType = message.Type.WARNING;
            } else if (bannerType === "ERROR") {
                messageType = message.Type.ERROR;
            } else if (bannerType === "INFORMATION") {
                messageType = message.Type.INFORMATION;
            }
            message
                .create({
                    type: messageType,
                    message: bannerMessage,
                })
                .show({
                    sendToClient: true,
                });
        });
    }

    /**
     * Prevents editing of transcation from UI by reloading with banner, based on configuration defined in E-Document Template
     */
    function checkAndPreventEditTransaction(txnRecord) {
        // Check only for UI Edit
        if (runtime.executionContext !== runtime.ContextType.USER_INTERFACE) {
            return;
        }
        // Retrieve Template field data
        var eiTxnTemplate = txnRecord.getValue(EI_TEMPLATE);
        if (!eiTxnTemplate) return;
        var templateRecordLookupResults = search.lookupFields({
            type: EI_TEMPLATE_RECORD_TYPE,
            id: eiTxnTemplate,
            columns: [EI_STATUS_FIELD],
        });
        if (!templateRecordLookupResults[EI_STATUS_FIELD]) return;
        var eiStatusesEditNotAllowed = [];
        for (
            var i = 0;
            i < templateRecordLookupResults[EI_STATUS_FIELD].length;
            i++
        ) {
            eiStatusesEditNotAllowed.push(
                templateRecordLookupResults[EI_STATUS_FIELD][i].value
            );
        }
        if (eiStatusesEditNotAllowed.length === 0) return;
        var eiStatus = txnRecord.getValue(EI_STATUS);
        if (eiStatusesEditNotAllowed.indexOf(eiStatus) === -1) return;

        // Reload with banner
        redirect.toRecord({
            type: txnRecord.type,
            id: txnRecord.id,
            isEditMode: false,
            parameters: {
                ei_process: "editNotAllowed",
                ei_mc: EDIT_TRANSACTION_RESTRICTED,
                ei_t: "w",
            },
        });
    }
    return {
        beforeLoad: beforeLoad,
        beforeSubmit: beforeSubmit,
        afterSubmit: afterSubmit,
    };
});