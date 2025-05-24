export function buildTallyXML({requestType,reportName,companyName}){
    return `
    <ENVELOPE>
    <HEADER>
        <TALLYREQUEST>${requestType} Data</TALLYREQUEST>
    </HEADER>
    <BODY>
        <EXPORTDATA>
            <REQUESTDESC>
                <REPORTNAME>${reportName}</REPORTNAME>
                <STATICVARIABLES>
                    <SVCURRENTCOMPANY>${companyName}</SVCURRENTCOMPANY>
                    <EXPLODEFLAG>Yes</EXPLODEFLAG>
                    <ISDETAILEDBYQUANTITY>Yes</ISDETAILEDBYQUANTITY>
                    <SHOWPROFITFLAG>Yes</SHOWPROFITFLAG>
                </STATICVARIABLES>
            </REQUESTDESC>
        </EXPORTDATA>
    </BODY>
</ENVELOPE>`.trim()//to remove whitespaces (if any)
}