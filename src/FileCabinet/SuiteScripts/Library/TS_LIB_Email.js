/**
* @NApiVersion 2.1
* @NModuleScope Public
* 
* Task          Date            Author                                         Remarks
* GAP 94        22 Jun 2023     Alexander Ruesta <aruesta@myevol.biz>          - Creación de la libreria
*
*/

define(['N/search', 'N/email'], (search, email) => {

    const sendEmail = (paramUser, paramSubject, paramBody, paramArrayUsers, userId) => {
        try {
            log.error('entroooooo primero')
            if (paramUser) {
                try {
                    var employSearch = search.lookupFields({
                        type: 'employee',
                        id: paramUser,
                        columns: ['email', 'firstname', 'lastname']
                    });
                    emailResult = employSearch.email;
                    nameResult = employSearch.firstname + ' ' + employSearch.lastname;
                } catch (msgerror) {
                    log.error('error', msgerror)
                    return true;
                }
                log.error('entroooooo 2', emailResult)

                if (!emailResult) {
                    log.debug('function sendemail ', 'Usuario no tiene correo');
                    return true;
                }
                if (userId) {
                    email.send({
                        author: userId,
                        recipients: emailResult,
                        subject: paramSubject,
                        body: paramBody
                    });
                } else {
                    email.send({
                        author: paramUser,
                        recipients: emailResult,
                        subject: paramSubject,
                        body: paramBody
                    });
                }
            } else {
                paramArrayUsers.forEach(function (employees) {
                    if (employees.id) {
                        try {
                            var employSearch = search.lookupFields({
                                type: 'employee',
                                id: employees.id,
                                columns: ['email', 'firstname', 'lastname']
                            });

                            emailResult = employSearch.email;
                            nameResult = employSearch.firstname + ' ' + employSearch.lastname;
                        } catch (msgerror) {
                            log.error('msgerror', msgerror)
                            return true;
                        }
                    }
                    log.error('mirame',employSearch )
                    if (!emailResult) {
                        log.debug('function sendemail ', 'Usuario no tiene correo');
                        return true;
                    }

                    email.send({
                        author: employees.id,
                        recipients: emailResult,
                        subject: paramSubject,
                        body: paramBody
                    });

                })
            }

        } catch (error) {
            log.error('sendConfirmUserEmail', error);
        }
    }

    return {
        sendEmail: sendEmail,
    };

})