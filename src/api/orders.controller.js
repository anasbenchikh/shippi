import axios from "axios";
import xml2js from 'xml2js';
import { doc, setDoc, Timestamp, addDoc, collection } from "firebase/firestore";
import { db } from "../config/firebase.js";
import OrdersDAO from "../dao/ordersDAO.js";
import Utils from "../utils/utils.js";
import fs from 'fs';
import { UsersDAO } from "../dao/usersDAO.js";
export default class OrdersController {



    // TODO read the uid from the request
    static async getExpeditions(req, res) {
        // const expeditions = await OrdersDAO.getOrders(db, 'orders')
        try {
            // const uid =  "VmYdhkRrptWtk9xwWRBhAnQGzE92";
            console.log('the uid now is ', req.body.user.uid)
            const expeditions = await OrdersDAO.getUserOrders(req.body.user.uid);
            console.log('hna  backend expeditions |||', expeditions)
            const data = expeditions.map(doc => ({id: doc.id, ...doc.data}));
            console.log('the expeditions mapped ', data)
            /*const configs = await UsersDAO.getUserConfigs(uid);
            console.log('The configs ', configs)*/
            return res.json(expeditions);
        } catch(e) {
            res.status(500).json({ error: 'Failed to fetch expeditions' });
        }

    }



    static async createTicket(req, res) {
        let data = req.body;
        const { BillingName, lastName, BillingCity, NoAppart, ShippingZip, ShippingPhone, Email } = req.body;
        console.log('data li jat ', data)
        console.log('data li jat ', data.shipData.Email)
        console.log('data li jat ', data.shipData.BillingCity)
        console.log('the uid ', data.shipData.BillingCity)
        console.log('the uid ', req.body.user.uid)
        const pointRelais = await OrdersController.getNumRelais("36250");
        console.log('Le num du point relais ', pointRelais)
        const configsData = await UsersDAO.filterConfigByCarrier(req.body.user.uid, 'Mondial Relay')
        const enterData = await UsersDAO.getCashedCompanyData(req.body.user.uid)
        console.log('conf data of  Mondial Relay', Utils.decrypt(configsData.apiData.motdepasse), enterData[0].nomEntreprise)
        try {
        const url = 'https://connect-api.mondialrelay.com/api/Shipment';
            const xmlRequest = `
    
                  <ShipmentCreationRequest xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                        xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns="http://www.example.org/Request">
                    <Context>
                        <Login>${configsData.apiData.id}</Login>
                        <Password>${Utils.decrypt(configsData.apiData.motdepasse)}</Password>
                        <CustomerId>BDTEST</CustomerId>
                        <Culture>fr-FR</Culture>
                        <VersionAPI>1.0</VersionAPI>
                        </Context>
                        <OutputOptions>
                        <OutputFormat>${configsData.format}</OutputFormat>
                        <OutputType>PdfUrl</OutputType>
                         </OutputOptions>
                        <ShipmentsList>
                        <Shipment>
                        <OrderNo>${data.shipData.Name}</OrderNo>
                        <CustomerNo>CUS1234</CustomerNo>
                        <ParcelCount>1</ParcelCount>
                        <DeliveryMode Mode="24R" Location="FR-55942" />
                        <CollectionMode Mode="CCC" Location="" />
                        <Parcels>
                            <Parcel>
                                <Content>Parfums</Content>
                                <Weight Value="1000" Unit="gr" />
                            </Parcel>
                        </Parcels>
                        <DeliveryInstruction>Livrer au fond a droite</DeliveryInstruction>
                        <Sender>
                            <Address>
                            <Title />
                            <Firstname />
                            <Lastname />
                             <Streetname>${enterData[0].adresse}</Streetname>
                            <HouseNo>8</HouseNo>
                            <CountryCode>FR</CountryCode>
                            <PostCode>${enterData[0].codePostale}</PostCode>
                            <City>${enterData[0].ville}</City>
                            <AddressAdd1>Mondial Relay</AddressAdd1>
                            <AddressAdd2 />
                            <AddressAdd3>Mondial Relay</AddressAdd3>
                            <PhoneNo />
                            <MobileNo></MobileNo>
                            <Email>${enterData[0].email}</Email>
                            </Address>
                        </Sender>
                        <Recipient>
                            <Address>
                            <Title>Mme</Title>
                            <Firstname>${data.shipData.BillingName}</Firstname>
                            <Lastname>${data.shipData.lastName}</Lastname>
                            <Streetname>${data.shipData.BillingCity}</Streetname>
                            <HouseNo>${data.shipData.NoAppart}</HouseNo>
                            <CountryCode>FR</CountryCode>
                            <PostCode>85220</PostCode>
                            <City>${data.shipData.BillingCity}</City>
                            <AddressAdd1 />
                            <AddressAdd2 />
                            <AddressAdd3 />
                            <PhoneNo></PhoneNo>
                            <MobileNo />
                            <Email>${data.shipData.Email}</Email>
                    </Address>
                        </Recipient>
                </Shipment>
            </ShipmentsList>
        </ShipmentCreationRequest>
`;
        console.log('Mondial Relay', xmlRequest)
        const response = await axios.post(url, xmlRequest, { headers: {
            'Content-Type': 'application/xml',
                'Accept': 'application/xml'
            }});

        const parser = new xml2js.Parser({
            explicitArray: false,
            trim: true,
            mergeAttrs: true
        });

        const result = await parser.parseStringPromise(response.data);
        console.log('the result ', result['ShipmentCreationResponse']['StatusList'])
        const parcelNumber = result['ShipmentCreationResponse']['ShipmentsList']['Shipment']['ShipmentNumber']
        console.log('thiiis', result['ShipmentCreationResponse']['StatusList'])
        console.log(result['ShipmentCreationResponse']['ShipmentsList']['Shipment']['LabelList']['Label']['Output'])
        console.log('this2', parcelNumber, req.body.user)
        const orderInfo = OrdersController.buildData('Mondial Relay', parcelNumber, '', data.shipData.Name, data.shipData.Email, data.shipData.lastName + data.shipData.BillingName);
        await OrdersDAO.addOrder(req.body.user.uid, orderInfo)
        //console.log(result['ShipmentCreationResponse']['ShipmentsList']['Shipment']['LabelList']['label'])
        return res.json(result['ShipmentCreationResponse']['ShipmentsList']['Shipment']['LabelList']['Label']['Output']);
        } catch (e) {
            console.log(`api, ${e}`)
            res.status(500).json({error: e})
        }
    }

    static async getOrderStatus(req, res) {
        try {
            const { city, zipCode } = req.body;
            const privateKey = "TestAPI1key";
            if (!zipCode) {
                return res.status(400).json({ error: "Le code postale est obligatoire"});
            }
            if (zipCode && typeof zipCode !== "string") {
                return res.status(400).json({error: 'Le code postale est invalide'});
            }
            const key = Utils.hashMD5("BDTEST13FR"+ zipCode +"2020" + privateKey);
            console.log('the key', key)
            const url = 'https://api.mondialrelay.com/Web_Services.asmx';
            const xmlString = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:web="http://www.mondialrelay.fr/webservice/">
                    <soapenv:Header/>
                            <soapenv:Body>
                                    <web:WSI4_PointRelais_Recherche>
                                        <!--Optional:-->
                                         <web:Enseigne>BDTEST13</web:Enseigne>
                                          <!--Optional:-->
                                          <web:Pays>FR</web:Pays>
                                          <!--Optional:-->
                                          <web:NumPointRelais></web:NumPointRelais>
                                          <!--Optional:-->
                                           <web:Ville></web:Ville>
                                           <!--Optional:-->
                                           <web:CP>${zipCode}</web:CP>
                                           <!--Optional:-->
                                           <web:Latitude></web:Latitude>
                                            <!--Optional:-->
                                           <web:Longitude></web:Longitude>
                                            <!--Optional:-->
                                            <web:Taille></web:Taille>
                                            <!--Optional:-->
                                            <web:Poids></web:Poids>
                                            <!--Optional:-->
                                            <web:Action></web:Action>
                                            <!--Optional:-->
                                            <web:DelaiEnvoi></web:DelaiEnvoi>
                                             <!--Optional:-->
                                            <web:RayonRecherche>20</web:RayonRecherche>
                                                <!--Optional:-->
                                             <web:TypeActivite></web:TypeActivite>
                                             <!--Optional:-->
                                             <web:NACE></web:NACE>
                                             <web:NombreResultats>20</web:NombreResultats>
                                            <!--Optional:-->
                                            <web:Security>${key}</web:Security>
                                    </web:WSI4_PointRelais_Recherche>
                            </soapenv:Body>
                    </soapenv:Envelope>`;
            const response = await axios.post(url, xmlString, { headers: {
                    'Content-Type': 'text/xml',
                    'Accept': 'text/xml'
            }});
            //console.log(xmlString)
           //  console.log(response.data)
            const parser = new xml2js.Parser({
                explicitArray: false,
                trim: true,
                mergeAttrs: true
            });
            console.log('the status', response.status)

            const result = await parser.parseStringPromise(response.data);
            const pointRL = result['soap:Envelope']['soap:Body']['WSI4_PointRelais_RechercheResponse']['WSI4_PointRelais_RechercheResult'];
            if (pointRL['STAT'] == 0) {
                console.log('here', pointRL['PointsRelais'])
                const pointExact = pointRL['PointsRelais']['PointRelais_Details'].find(point => point.LgAdr1 === "LA MARINGOTTE");
                const uniquePoint = pointExact[0];
                console.log('le point est ', pointExact)
                console.log('le num du point est ', pointExact['Num'])
            }
            //console.log("the fianl", result['soap:Envelope']['soap:Body']['WSI4_PointRelais_RechercheResponse']['WSI4_PointRelais_RechercheResult']);
            return res.json(result);
        } catch (e) {
            console.log(`api, ${e}`)
            res.status(500).json({error: e})
        }
    }

    static async createLabelColissimo(req, res) {
        const url = "https://ws.colissimo.fr/sls-ws/SlsServiceWSRest/2.0/generateLabel";
        const { lastName, firstName,  NoAppart, BillingCity, ShippingZip, Name } = req.body.colissimoData;
        console.log(lastName, firstName, NoAppart, BillingCity, ShippingZip, Name, req.body.user.uid, req.body.colissimoData)
        if (!lastName || !firstName || !NoAppart || !BillingCity || !ShippingZip) {
            return res.status(400).json({ error: "Les informations clients sont invalides"});
        }
        let parcelNumber, parcelNumberPartner;
        const configsData = await UsersDAO.filterConfigByCarrier(req.body.user.uid, 'Colissimo');
        const enterData = await UsersDAO.getCashedCompanyData(req.body.user.uid)
        console.log("the config data", configsData)
        const payload = {
            "contractNumber": configsData.apiData.id,
            "password": "Azureus123@@", //Utils.decrypt(configsData.apiData.password),
            "outputFormat": {
                "x": 0,
                "y": 0,
                "outputPrintingType": configsData.format
            },
            "letter": {
                "service": {
                    "productCode": "DOM",
                    "depositDate": Utils.getFormattedDate(),
                    "orderNumber": "2344555",
                    "commercialName": enterData[0].nomEntreprise
                },
                "parcel": {
                    "weight": configsData.weight
                },
                "sender": {
                    "senderParcelRef": "senderParcelRef",
                    "address": {
                        "companyName": enterData[0].nomEntreprise,
                        "line0": "",
                        "line1": "",
                        "line2": enterData[0].adresse,
                        "line3": "",
                        "countryCode": "FR",
                        "city": enterData[0].ville,
                        "zipCode": enterData[0].codePostale

                    }
                },
                "addressee": {
                    "addresseeParcelRef": "addresseeParcelRef",
                    "address": {
                        "lastName": lastName,
                        "firstName": firstName,
                        "line0": "",
                        "line1": "",
                        "line2": NoAppart,
                        "countryCode": "FR",
                        "city": BillingCity,
                        "zipCode": ShippingZip.slice(1)
                    }
                }
            }
        };
        const headers = {
            'Content-Type': 'application/json',
        };
        try {
            console.log('before', JSON.stringify(payload))
            const response = await axios.post(url, payload, { headers, responseType: 'arraybuffer'});
            if (response.status == 200) {
                console.log('here the 200', response.data)
                const buffer = Buffer.from(response.data, 'binary'); // Convert response data to Buffer

                // Convert buffer to string (if it contains text data)
                const dataString = buffer.toString('utf8');
                const lines = dataString.split(/\r?\n/);
                const jsonLines = JSON.parse(lines[6]);
                console.log('Response as string:', jsonLines['labelV2Response']);
                parcelNumber = jsonLines['labelV2Response']['parcelNumber'];
                parcelNumberPartner = jsonLines['labelV2Response']['parcelNumberPartner'];

                const orderInfo = OrdersController.buildData('Colissimo', parcelNumber, parcelNumberPartner, Name, Name, lastName + " " + firstName, NoAppart +  " " + BillingCity + ShippingZip);
                console.log('harimna min Ajli hadihi la7da', orderInfo)
                req.body.colissimoData.carrier =  "Colissimo";
                req.body.colissimoData.parcelNumber =  parcelNumber;
                req.body.colissimoData.creationDate = new Date().toISOString();
                /*const shipmentData = {
                    carrier: 'Colissimo',
                    parcelNumber: 'N/A',
                    parcelNumberPartner: 'N/A',
                }*/
                // TODO Ajoutez L'objet comme il est cette fois et renommer le ticket avec le num de la commande
                const numTicket = req.body.colissimoData.Name;
                const filePath = '/Users/macos/Downloads/' + numTicket + 'label.pdf';
                fs.writeFileSync(filePath, response.data, 'binary');
                // await OrdersDAO.addOrder(req.body.user.uid, orderInfo);
                await OrdersDAO.addOrder(req.body.user.uid, req.body.colissimoData);
                res.download(filePath, 'label.pdf', (err) => {
                    if (err) {
                        console.log('Error Sending file');
                        res.status(500).send('Error downloading file');
                    } else {
                        fs.unlink(filePath, (err) => {
                            if (err) console.error('Error deleting file:', err);
                        })
                    }
                })
                console.log('Colissimo Label saved as label.pdf and store it in Firestore');
            }


            //console.log(`File saved at: ${filePath}`);
        } catch (e) {
            console.log('Error generating Colissimo label:', e.message);
            console.log(`api, ${e}`)
            console.log('Error response:', e.response);
            console.log('Error response data:', e.response?.data);
            const buffer = Buffer.from(e.response.data, 'binary'); // Convert response data to Buffer

            // Convert buffer to string (if it contains text data)
            const dataString = buffer.toString('utf8');
            const lines = dataString.split(/\r?\n/);
            const jsonLines = JSON.parse(lines[6]);
            console.log('thz info formatted ', jsonLines)
            res.status(500).json({error: e})
        }

    }

    static async getNumRelais(zipCode) {
        console.log("the zip code is", zipCode)
        try {
            const privateKey = "TestAPI1key";
            if (!zipCode) {
                return res.status(400).json({ error: "Le code postale est obligatoire"});
            }
            if (zipCode && typeof zipCode !== "string") {
                return res.status(400).json({error: 'Le code postale est invalide'});
            }
            const key = Utils.hashMD5("BDTEST13FR"+ zipCode +"2020" + privateKey);
            console.log('the key', key)
            const url = 'https://api.mondialrelay.com/Web_Services.asmx';
            const xmlString = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:web="http://www.mondialrelay.fr/webservice/">
                    <soapenv:Header/>
                            <soapenv:Body>
                                    <web:WSI4_PointRelais_Recherche>
                                        <!--Optional:-->
                                         <web:Enseigne>BDTEST13</web:Enseigne>
                                          <!--Optional:-->
                                          <web:Pays>FR</web:Pays>
                                          <!--Optional:-->
                                          <web:NumPointRelais></web:NumPointRelais>
                                          <!--Optional:-->
                                           <web:Ville></web:Ville>
                                           <!--Optional:-->
                                           <web:CP>${zipCode}</web:CP>
                                           <!--Optional:-->
                                           <web:Latitude></web:Latitude>
                                            <!--Optional:-->
                                           <web:Longitude></web:Longitude>
                                            <!--Optional:-->
                                            <web:Taille></web:Taille>
                                            <!--Optional:-->
                                            <web:Poids></web:Poids>
                                            <!--Optional:-->
                                            <web:Action></web:Action>
                                            <!--Optional:-->
                                            <web:DelaiEnvoi></web:DelaiEnvoi>
                                             <!--Optional:-->
                                            <web:RayonRecherche>20</web:RayonRecherche>
                                                <!--Optional:-->
                                             <web:TypeActivite></web:TypeActivite>
                                             <!--Optional:-->
                                             <web:NACE></web:NACE>
                                             <web:NombreResultats>20</web:NombreResultats>
                                            <!--Optional:-->
                                            <web:Security>${key}</web:Security>
                                    </web:WSI4_PointRelais_Recherche>
                            </soapenv:Body>
                    </soapenv:Envelope>`;
            const response = await axios.post(url, xmlString, { headers: {
                    'Content-Type': 'text/xml',
                    'Accept': 'text/xml'
                }});
            //console.log(xmlString)
            //  console.log(response.data)
            const parser = new xml2js.Parser({
                explicitArray: false,
                trim: true,
                mergeAttrs: true
            });
            console.log('the status', response.status)

            const result = await parser.parseStringPromise(response.data);
            const pointRL = result['soap:Envelope']['soap:Body']['WSI4_PointRelais_RechercheResponse']['WSI4_PointRelais_RechercheResult'];
            if (pointRL['STAT'] == 0) {
                console.log('here', pointRL['PointsRelais'])
                const pointExact = pointRL['PointsRelais']['PointRelais_Details'].find(point => point.LgAdr1 === "TABAC PRESSE LE RELAIS SAINT MA");
                const uniquePoint = pointExact[0];
                console.log('le point est ', pointExact)
                console.log('le num du point est ', pointExact['Num'])
                return uniquePoint;
            }
            //console.log("the fianl", result['soap:Envelope']['soap:Body']['WSI4_PointRelais_RechercheResponse']['WSI4_PointRelais_RechercheResult']);
            return null;
        } catch (e) {
            console.log(`api, ${e}`);
            return e;
        }
    }

    static buildData(carrier, parcelNumber, parcelNumberPartner, idOrder, email, fullname, adress) {

        return {
            carrier: carrier || 'unkown',
            parcelNumber: parcelNumber || 'N/A',
            parcelNumberPartner: parcelNumberPartner || 'N/A',
            idOrder: idOrder || 'N/A',
            email: email || 'N/A',
            fullName: fullname || 'N/A',
            adress: adress || 'N/A',
            creationDate: new Date().toISOString(),
        };
    }

    static async getExpeditionsStatistics(req, res) {
        try {
            const statistics = await OrdersDAO.countUserOrders(req.body.user.uid);
            return res.json(statistics);
        } catch (e) {
            res.status(500).json({ error: 'Failed to calculate statistics' });
        }
    }
}