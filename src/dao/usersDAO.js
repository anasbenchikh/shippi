import { db } from "../config/firebase.js";
import { getDocs } from "firebase/firestore";
import admin from "firebase-admin"
export class UsersDAO {

    constructor() {
        this.cachedConfiguration = null;
        this.companyData = null;
    }


    static async getCompanyData(uid) {
        try {
            const companyRef = await UsersDAO.getSubCollection("users", uid, "company");
            this.companyData = companyRef.map(doc => doc.data);
            return this.companyData;
        } catch(e) {
            console.error(`Error occurred while adding company data to user, ${e}`)
            return {error: e}
        }
    }

    static async getCashedCompanyData(uid) {
        try {
            if (this.companyData) {
                console.log("fetching data from cache")
                return this.companyData;
            }
            return await this.getCompanyData(uid);
        } catch (e) {
            console.error(`Error occurred while fetching company data and cashed, ${e}`)
            return {error: e}
        }


    }

    static async addCompanyData(uid, data) {
        try {
            const docRef = await db.collection("users").doc(uid);
            const subCollectionRef = docRef.collection("company");
            const newSubDocRef = await subCollectionRef.add(data);
            const companyData = await UsersDAO.getCompanyData(uid);
            const configs = await UsersDAO.getUserConfigs(uid);
            // console.log("the company data added succefully", await UsersDAO.getCashedCompanyData(), await UsersDAO.getCashedConfiguration(), configs)
        } catch(e) {
            console.error(`Error occurred while adding company data to user, ${e}`)
            return {error: e}
        }
    }

    static async addSettingsToUser(uid, subCollectionName, data) {

        try {
            this.cachedConfiguration = await this.getUserConfigs(uid);
            const docRef = await db.collection("users").doc(uid);
            const settings = await UsersDAO.getSubCollection("users", uid, "settings")
            const userDoc = await docRef.get();
            let documentUpdated = false;
            if (!userDoc.exists) {
                console.log("User document doesn't exist, creating...");
                //await setDoc(userRef,...data, { createdAt: new Date() });
                await docRef.set({uid, createdAt: new Date()});
                console.log("User document addeed with success...");
                const subCollectionRef = docRef.collection("settings");
                const newSubDocRef = await subCollectionRef.add(data);
                /*await setDoc(userDoc, {
                    uid
                }, {merge: true});
                // const subCollectionRef = collection(userRef, subCollectionName);
                await addDoc(userDoc, {
                    ...data,
                    createdAt: new Date()
                });*/
            } else {
                console.log("we are the user exists with settings maybe, check if le carrier existe a le mettre a jour", settings[0].data)
                settings.forEach(async (setting) => {
                    console.log('the carrier', setting.data.carrier, data.carrier, data)
                    if (setting.data.carrier === data.carrier) {
                        console.log('we are hererrrrr')
                        const docReference = docRef.collection("settings").doc(setting.id);
                        console.log('condition remplie le carrier existe', documentUpdated)
                        documentUpdated = true;
                        await docReference.set(data, { merge: true })
                    }
                });
            } if (documentUpdated === false) {
                console.log("Ajouter un nouveau document", documentUpdated)
                const subCollectionRef = docRef.collection("settings");
                const newSubDocRef = await subCollectionRef.add(data);
            }
        } catch(e) {
            console.error(`Error occurred while adding settings to user, ${e}`)
            return {error: e}
        }
    }

    static async getSubCollection(collectionName, docId, subCollectionName) {
        try {
            // First get the parent document reference
            const parentDocRef = await db.collection(collectionName).doc(docId);

            // Then get the subcollection reference
            const subCollectionRef = parentDocRef.collection(subCollectionName);

            // Now you can query the subcollection
            const snapshot = await subCollectionRef.get();

            // Process the results...
            const documents = [];
            snapshot.forEach(doc => {
                documents.push({
                    id: doc.id,
                    data: doc.data()
                });
            });

            return documents;
        } catch (error) {
            console.error('Error getting subcollection:', error);
            throw error;
        }
    }


    static async getUserConfigs(uid) {

        try {
            const snapshot = await UsersDAO.getSubCollection("users", uid, "settings");
            this.cachedConfiguration = snapshot.map(doc => doc.data); // Met à jour le cache avec les nouvelles données
            // console.log('Data fetched and cached:', this.cachedData);
            return snapshot.map(doc => doc.data);
        } catch (e) {
            console.error(`Error occurred while getting configs, ${e}`)
            return { error: e }
        }
    }

    // TODO Remplacer this.cashedData par la variable globale cad this.cashedData = les nouveaux données en provenance d'Angular -- Penser a changer les données du cash dans la méthode addSettingsToUser
    static async getCashedConfiguration(uid) {
        try {
            if (this.cachedConfiguration) {
                console.log('the data is fetched from the cash ', this.cachedConfiguration)
                return this.cachedConfiguration;
            }
            console.log('the cash is empty ', this.cachedConfiguration)
            return await this.getUserConfigs(uid);
        } catch (e) {
            console.error(`Error occurred while getting configs , ${e}`)
            return { error: e }
        }
    }


    static async filterConfigByCarrier(uid, carrier) {
        try {
            const configs = await this.getCashedConfiguration(uid);
            console.log('the carrier', configs)
            const confCarrier = configs.find(item => item.carrier === carrier);
            console.log('the carrier selected', confCarrier, confCarrier.apiData, confCarrier.format)
            return confCarrier;
        } catch (e) {
            console.error(`Error occurred while getting configs by carrier, ${e}`)
            return { error: e }
        }

    }

}