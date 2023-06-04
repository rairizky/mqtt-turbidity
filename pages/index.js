import mqtt from "mqtt";
import Head from "next/head";
import { useEffect, useState } from "react";

import { faker } from "@faker-js/faker";

import { initializeApp } from "firebase/app";
import {
  getRemoteConfig,
  fetchAndActivate,
  getString,
} from "firebase/remote-config";

export default function Home() {
  // variable
  const [ntu, setNtu] = useState(0);
  const [food, setFood] = useState(null);
  const [waterLevel, setWaterLevel] = useState(null);

  const [client, setClient] = useState(null);

  // publisher
  function waterPublisher(topic, message) {
    // show log
    // console.log(`Topic: ${topic}, Message: ${message}`);

    // publish
    if (client) {
      client.publish(topic, message, { qos: 0, retain: false });
    }
  }

  // mount client
  useEffect(() => {
    if (typeof window !== "undefined") {
      // firebase init
      const firebaseConfig = {
        apiKey: "AIzaSyBgnAzSdju516OQqT4qDYOGiCHkN1KJd3c",
        authDomain: "turbidity-6ee59.firebaseapp.com",
        projectId: "turbidity-6ee59",
        storageBucket: "turbidity-6ee59.appspot.com",
        messagingSenderId: "1001498514094",
        appId: "1:1001498514094:web:251e303e10a8cbf05c533f",
        measurementId: "G-49TJ3XF9J4",
      };

      const app = initializeApp(firebaseConfig);
      const remoteConfig = getRemoteConfig(app);

      fetchAndActivate(remoteConfig)
        .then(() => {
          const ipaddress = getString(remoteConfig, "ipaddress");
          const port = getString(remoteConfig, "port");

          // mqtt
          const options = {
            protocol: "ws",
            username: "admin",
            password: "public",
            keepalive: 20,
            clientId: "emqx_client",
          };

          const connectUrl = `mqtt://${ipaddress}:${port}/mqtt`;

          const client = mqtt.connect(connectUrl, options);

          setClient(client);

          // subscribe topic
          client.subscribe("test.publisher");

          // receive message
          client.on("message", (_, message) => {
            const data = JSON.parse(message.toString());

            setNtu(data?.ntu);
            setFood(data?.food);
            setWaterLevel(data?.waterLevel);
          });
        })
        .catch(err => {
          console.log(err);
        });
    }
  }, []);

  // mount publisher
  useEffect(() => {
    setInterval(() => {
      // initiate
      const topic = "test.publisher";
      const message = {
        ntu: faker.number.float({ min: 0, max: 70, precision: 0.01 }),
        food: faker.datatype.boolean(),
        waterLevel: faker.datatype.boolean(),
      };

      // call func
      waterPublisher(topic, JSON.stringify(message));
    }, 3000);
  }, [client]);

  return (
    <div className="font-Poppins">
      <Head>
        <title>Water Meter</title>
      </Head>
      <div className="fixed w-full px-2 py-4 bg-blue-500 shadow-xl">
        <h1 className="text-xl font-semibold text-center text-white">
          Water Meter
        </h1>
      </div>

      <div className="px-4 pt-[72px] space-y-4">
        <div className="px-4 py-8 mt-4 space-y-5 border rounded-xl">
          <h5 className="text-xl font-semibold text-center">
            Aquarium Water
            <br />
            Turbidity
          </h5>
          <div className="flex justify-center">
            <div className="border-[10px] w-32 h-32 flex flex-col justify-center items-center rounded-full border-blue-300">
              <h5 className="text-3xl font-bold text-center">{ntu}</h5>
              <h6 className="text-sm text-center">NTU</h6>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 divide-x">
          <div>
            <h6 className="text-xs text-center">
              Water
              <br />
              Condition
            </h6>
            {ntu > 19 ? (
              <h6 className="text-sm font-semibold text-center text-red-500">
                Dirty
              </h6>
            ) : (
              <h6 className="text-sm font-semibold text-center text-blue-500">
                Clean
              </h6>
            )}
          </div>
          <div>
            <h6 className="text-xs text-center">
              Food
              <br />
              Tank
            </h6>
            {food ? (
              <h6 className="text-sm font-semibold text-center text-green-500">
                Filled
              </h6>
            ) : (
              <h6 className="text-sm font-semibold text-center text-red-500">
                Empty
              </h6>
            )}
          </div>
          <div>
            <h6 className="text-xs text-center">
              Water
              <br />
              Level
            </h6>
            {waterLevel ? (
              <h6 className="text-sm font-semibold text-center text-green-500">
                Enough Water
              </h6>
            ) : (
              <h6 className="text-sm font-semibold text-center text-red-500">
                Low Water
              </h6>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

