$(document).ready(function () {
    function updateValues(){
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
    }


    updateValues();

    $('.donate').click(function () {
        var toastElement = document.getElementById('ValueToast');
        var toast = new bootstrap.Toast(toastElement);
        toast.show();
    })

    function showToast(id) {
        const toastEl = document.getElementById(id);
        if (toastEl) {
            const toast = bootstrap.Toast.getOrCreateInstance(toastEl);
            toast.show();
        }
    }
    
    $('#send').click(async function () {
        const valueInput = document.getElementById('donationValue').value.trim();
    
        // Validação local
        if (!valueInput || isNaN(valueInput) || Number(valueInput) <= 0) {
            showToast('InvalidValueToast');
            return;
        }
    
        if (!window.ethereum) {
            showToast('InvalidValueToast');
            return;
        }
    
        try {
            const response = await api.get('/info');
            const { abi, contractAddress } = response.data;
    
            await window.ethereum.request({ method: 'eth_requestAccounts' });
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const contract = new ethers.Contract(contractAddress, abi, signer);
    
            showToast('ProcessToast');
    
            const tx = await contract.donate({
                value: ethers.parseEther(valueInput)
            });
    
            await tx.wait();
            showToast('SuccessToast');
            updateValues(); // Atualiza os dados após doação
        } catch (err) {
            console.error(err);
    
            if (err.code === 4001) {
                // Usuário rejeitou a transação no MetaMask
                showToast('InvalidValueToast');
            } else {
                showToast('GenericErrorToast');
            }
        }
    });

    const MAX_DECIMALS = 18;
    const input = document.getElementById('donationValue');
    let rawDigits = ""; // só os dígitos digitados
    
    function formatETH(digits) {
        if (!digits) return "0";
    
        digits = digits.replace(/^0+/, '') || '0';
    
        const full = digits.padStart(MAX_DECIMALS + 1, '0');
        const intPart = full.slice(0, -MAX_DECIMALS);
        const decPart = full.slice(-MAX_DECIMALS).replace(/0+$/, '');
    
        return decPart ? `${intPart}.${decPart}` : intPart;
    }
    
    input.addEventListener('keydown', (e) => {
        // Permitir apenas números e backspace
        if (e.key >= '0' && e.key <= '9') {
            e.preventDefault();
            rawDigits += e.key;
        } else if (e.key === 'Backspace') {
            e.preventDefault();
            rawDigits = rawDigits.slice(0, -1);
        } else if (
            e.key !== 'Tab' &&
            e.key !== 'ArrowLeft' &&
            e.key !== 'ArrowRight'
        ) {
            e.preventDefault(); // bloquear tudo exceto navegação
        }
    
        input.value = formatETH(rawDigits);
    });
    
    // Prevenir colar
    input.addEventListener('paste', e => e.preventDefault());
});

