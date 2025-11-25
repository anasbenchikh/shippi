import  { auth }  from "../config/firebase.js"
import { db } from "../config/firebase.js";
import { createUserWithEmailAndPassword, getAuth } from "firebase/auth";
//import {  initializeApp } from "firebase/app";
///import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
//import { initializeApp } from 'firebase/app';
import { Timestamp, collection, doc, getDoc, setDoc } from "firebase/firestore";
import { UsersDAO } from "../dao/usersDAO.js";
import Utils from "../utils/utils.js";


export default class UserController {

    static async signUp(req, res) {
        const { email, password, displayName } = req.body;
        try {
            console.log(req.body)
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                email,
                password
            );
            const user = userCredential.user;
            const uid = user.uid;
            console.log('here the user in sign Up', auth)
            // Check if the user exists in Firestore
            const userRef = doc(db, 'users', uid);
            const userDoc = await getDoc(userRef);

            if (!userDoc.exists()) {
                await setDoc(userRef, {
                    uid: uid,
                    email: email,
                    displayName: displayName || '',
                    createdAt: Timestamp.now()
                });
                res.status(201).json({message: 'User created successfully!', uid});
            } else {
                res.status(200).json({message: 'User already exists.', uid});
            }
        } catch (error) {
            console.error('Signup error:', error);
            return res.status(500).json({
                success: false,
                message: error.message || 'Error creating user'
            });

        }
    }

    static async signIn(req, res) {

    }

    static async userSettings(req, res) {
        try {
            const { uid, token, carrier, format, weight, apiData } = req.body.settingsData;
            // console.log('the user token is ', UserController.getUserToken())
            console.log('the settings of user are  ', req.body)
            const decodedToken = await auth.verifyIdToken(token);
            console.log('the token after verifcation', decodedToken)
            // const isThereDco = await UsersDAO.isDocumentUnique(uid, "settings", "carrier", "Mondial Relay");
            //console.log('check the doc', isThereDco)
            //if (isThereDco) {
              //  console.log('The documents are ', await UsersDAO.getUserSubCollection(uid, "settings"));
            //}
            if (carrier === "Colissimo") {
                apiData.password = Utils.encrypt(apiData.password);
                console.log('the paas encrypted with condition', apiData.password)
            } else if (carrier === "Mondial Relay") {
                apiData.clePrivee = Utils.encrypt(apiData.clePrivee);
                apiData.motdepasse = Utils.encrypt(apiData.motdepasse);
                console.log("The API Key encrypted ", apiData.clePrivee, apiData.motdepasse, Utils.decrypt(apiData.motdepasse))
            }

            await UsersDAO.addSettingsToUser(uid, 'settings', { carrier, format, weight, apiData });
            await UsersDAO.filterConfigByCarrier(uid, 'Mondial Relay')
            return res.status(200).json("settings added to user")
        } catch(error) {
            console.log("Error Adding settings to user");
            return res.status(500).json({
                success: false,
                message: error.message || 'Error creating user'
            });
        }
    }

    static async companyData(req, res) {
        try {
            const { uid, token, companyData } = req.body;
            console.log('teh company data ', req.body.data.token, req.body)
            // const decodedToken = await auth.verifyIdToken(req.body.data.token);
            await UsersDAO.addCompanyData(req.body.data.uid, req.body.data.companyData);
        } catch(error) {
            console.log("Error Adding company data to user");
            return res.status(500).json({
                success: false,
                message: error.message || 'Error adding comapny data user'
            });
        }
    }


}