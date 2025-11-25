import { db } from "../config/firebase.js";
import { addDoc, collection, getDocs, doc } from "firebase/firestore";
import { UsersDAO } from "./usersDAO.js";


export default class OrdersDAO {

    static async addOrder(uid, data) {
        try {
            const docRef = db.collection("users").doc(uid);
            const subColRef = docRef.collection("orders");
            const order = await subColRef.add(data);
            console.log("Order added to the subcollection")
        } catch (error) {
            console.log("Error Adding order");
            throw error;
        }
        //const docRef = await addDoc(collection(db, collectionName), data);
        //console.log("Document written with ID: ", docRef.id);
    }

    static async getOrders(db, collectionName) {
        try {
            const querySnapshot = await getDocs(collection(db, "orders"));
            const data = [];
            querySnapshot.forEach((doc) => {
                data.push({ id: doc.id, ...doc.data() });
                // doc.data() is never undefined for query doc snapshots
                console.log(doc.id, " => ", doc.data());
            });

            return data;
        } catch (error) {
            console.error("Error fetching data ")
            throw error;
        }

    }

    static async getUserOrders(uid) {
        try {
            const orders = await UsersDAO.getSubCollection("users", uid, "orders");
            orders.forEach(item => {
                if (item && item.data.creationDate) {
                    item.data.creationDate = item.data.creationDate.replace('T', ' ').replace('.000Z', '').slice(0, -5);
                }
            });
            const stat = await this.countUserOrders(uid)
            console.log('le nombre totale des commandes par user', orders.length, stat.carrierDistribution.data)
            return orders;
        } catch (error) {
            console.error("Error fetching data ")
            throw error;
        }
    }

    static async countUserOrders(uid) {
        try {
            const expeditions = await UsersDAO.getSubCollection("users", uid, "orders");
            const data = expeditions.map(doc => ({id: doc.id, ...doc.data}));

            const stats = {
                summary: {
                    total: expeditions.length,
                    cancelled: 0
            },

                carrierDistribution: {
                    labels: [],
                    data: []
                },

                deliveryType: {
                    labels: [],
                    data: []
                }
        };

            const carrierCount = data.reduce((acc, expedition) => {
                const carrier = expedition.carrier || 'unknown';
                acc[carrier] = (acc[carrier] || 0) + 1;
                return acc;
                }, {})


            stats.carrierDistribution.labels = Object.keys(carrierCount);
            stats.carrierDistribution.data = Object.values(carrierCount);
            console.log('the statistics of expedition', stats)
            return stats;
        } catch (error) {
            console.error("Error counting users orders ");
            throw error;
        }
    }
}