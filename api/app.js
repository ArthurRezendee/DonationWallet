require('dotenv').config();
const express = require('express');
const { ethers } = require('ethers');
const axios = require('axios');

const app = express();
const PORT = 3000;

app.use(express.json());

const provider = new ethers.JsonRpcProvider(process.env.URL_RPC);
const contractAddress = process.env.CONTRACT_ADDRESS;

const ethersacan_api = "https://api-sepolia.etherscan.io/api";

async function getAbi() {
    try {
        const response = await axios.get(ethersacan_api, {
            params: {
                module: "contract",
                action: "getabi",
                address: contractAddress,
                apikey: process.env.ETHERSCAN_API_KEY,
            },
        });

        if (response.data.status === "1") {
            const abi = JSON.parse(response.data.result);
            return abi;
        } else {
            console.error("Erro ao buscar ABI:", response.data.result);
            return null;
        }
    } catch (err) {
        console.error("Erro na requisição:", err.message);
        return null;
    }
}

app.get('/', async (req, res) => {
    return res.status(200).json({ message: "API rodando" });
});

app.get('/donations', async (req, res) => {
    try {
        const abi = await getAbi();
        if (!abi) return res.status(500).json({ error: "Não foi possível carregar ABI" });

        const contract = new ethers.Contract(contractAddress, abi, provider);
        const donations = await contract.getDonations();

        const parsedDonations = donations.map(d => ({
            donor: d.donor,
            amount: ethers.formatEther(d.amount),
        }));

        return res.status(200).json({ donations: parsedDonations });

    } catch (error) {
        console.error("Erro:", error);
        return res.status(500).json({ error: "Erro ao buscar doações" });
    }
});

app.get('/balance', async (req, res) => {
    try {
        const balanceWei = await provider.getBalance(contractAddress);
        const balanceEth = ethers.formatEther(balanceWei);

        return res.status(200).json({ balance: balanceEth });
    } catch (error) {
        console.error("Erro ao buscar saldo:", error);
        return res.status(500).json({ error: "Erro ao buscar saldo do contrato" });
    }
});

app.get('/total-donated', async (req, res) => {
    try {
        const abi = await getAbi();
        if (!abi) return res.status(500).json({ error: "Não foi possível carregar ABI" });

        const contract = new ethers.Contract(contractAddress, abi, provider);
        const donations = await contract.getDonations();

        let totalDonated = 0;
        donations.forEach(item => {
            totalDonated += parseFloat(ethers.formatEther(item.amount));
        });

        return res.status(200).json({ totalDonated: totalDonated });
    } catch (error) {
        console.error("Erro ao buscar total doado:", error);
        return res.status(500).json({ error: "Erro ao buscar total doado" });
    }
});

app.get('/donors', async (req, res) => {
    try {
        const abi = await getAbi();
        if (!abi) return res.status(500).json({ error: "Não foi possível carregar ABI" });

        const contract = new ethers.Contract(contractAddress, abi, provider);
        const donations = await contract.getDonations();

        let donors = []
        donations.forEach(item => {
            const donor = item.donor;
            const amount = parseFloat(ethers.formatEther(item.amount));

            const existingDonor = donors.find(d => d.donor === donor);
            if (existingDonor) {
                existingDonor.amount += amount;
            } else {
                donors.push({ donor, amount });
            }
        });

        return res.status(200).json({ donors: donors });
    } catch (error) {
        console.error("Erro ao buscar doadores:", error);
        return res.status(500).json({ error: "Erro ao buscar doadores" });
    }
});



app.listen(PORT, () => {
    console.log(`API rodando em http://localhost:${PORT}`);
});
