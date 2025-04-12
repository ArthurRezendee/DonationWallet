$(document).ready(function () {
    Promise.all([
        api.get('donations'),
        api.get('total-donated'),
        api.get('donors')
    ])
    .then(function ([donationsRes, totalRes, donorsRes]) {
        let htmlDonations = '';
        let id = 0;
        donationsRes.data.donations.forEach(function (donation) {
            htmlDonations += `
                <tr>
                    <td class='text-center'>${++id}</td>
                    <td class='text-start'>${donation.donor}</td>
                    <td class='text-start'>${donation.amount}</td>
                </tr>
            `;
        });
        $('#donationsTable').html(htmlDonations);

        $('#totalDonated').text(totalRes.data.totalDonated + ' (ETH)');

        let htmlDonors = '';
        donorsRes.data.donors.forEach(function (d, index) {
            htmlDonors += `
                <tr>
                    <td class='text-center'>${index + 1}</td>
                    <td class='text-start'>${d.donor}</td>
                    <td class='text-end'>${d.amount}</td>
                </tr>
            `;
        });
        $('#donorsTable').html(htmlDonors);
    })
    .catch(function (error) {
        console.error('Erro ao buscar dados:', error);
    });


    $('.donate').click(async function(){
        await api.get('/info')
        .then(async function (response) {
            const {abi, contractAddress} = response.data;
    
            const valueInput = "0.0001"
    
          if (!window.ethereum) {
            alert("MetaMask não detectado.");
            return;
          }
    
          await window.ethereum.request({ method: 'eth_requestAccounts' });
    
          const provider = new ethers.BrowserProvider(window.ethereum);
          const signer = await provider.getSigner();
    
          const contract = new ethers.Contract(contractAddress, abi, signer);
    
          try {
            const tx = await contract.donate({
              value: ethers.parseEther(valueInput)
            });
    
            console.log("Transação enviada! Aguardando confirmação...");
            await tx.wait();
            alert("Doação enviada com sucesso!");
          } catch (err) {
            console.error(err);
            alert("Erro ao enviar doação.");
          }
        })
    })
});

