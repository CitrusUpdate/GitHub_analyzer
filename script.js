const githubForm = document.getElementById('github-form');
const result = document.getElementById('result');

githubForm.addEventListener('submit', getData)

async function getData(event) {
    event.preventDefault(); // prevents page refresh on form submit!

    const username = document.getElementById('username').value.trim();
    result.innerHTML = '<p style="margin-top: 16px;">Ładowanie danych...</p>';

    if(!username) {
        result.innerHTML = '<p style="color: red">Podaj nazwe użytkownika</p>'
        return;
    } else if(username.length <= 1) {
        result.innerHTML += '<p style="color: red">Nazwa powinna miec przynajmniej jeden znak!</p>';
    } else if(!/^[a-zA-Z0-9-]+$/.test(username)) {
        return showError('Nazwa użytkownika może zawierać tylko litery cyfry i myśliniki');
    }

    try{
        const userRes = await fetch(`https://api.github.com/users/${username}`);
        if(!userRes.ok) throw new Error('Użytkownik nie znaleziony');
        const user = await userRes.json();

        const reposRes = await fetch(`https://api.github.com/users/${username}/repos?per_page=100`);
        const repos = await reposRes.json();

        if(!Array.isArray(repos)) throw new Error('Błąd w odpowiedzi repo');
        
        const total = repos.length;

        //counting languages
        const langCount = {};

        repos.forEach(r => {
            if(r.language) {
                langCount[r.language] = (langCount[r.language] || 0) + 1;
            }
        });

        //sort and take top 3
        const topLangs = Object.entries(langCount) 
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([lang, count]) => `${lang} (${count})`)
        .join(', ') || 'Brak danych';

        //last update
        const lastUpdated = repos
        .map(r => new Date(r.updated_at))
        .sort((a, b) => b - a)[0];

        const lastAct = lastUpdated ? lastUpdated.toLocaleDateString('pl-PL', { year: 'numeric', month: '2-digit', day: '2-digit' }) : 'brak';

        //percentage with descirption
        const withDesc = repos.filter(r => r.description && r.description.trim().length).length;
        const pctDesc = parseInt(total ? Math.round((withDesc / total) * 100) : 0);

        //how much days after last update
        const now = new Date();
        const daysSinceLast = lastUpdated ? Math.floor((now - lastUpdated) / (1000 * 60 * 60 * 24)) : null;

        let summaryMsg = '';
        if(daysSinceLast !== null) {
            if(daysSinceLast > 30) {
                summaryMsg = `
                    <p style="color: orange; margin-top: 16px; margin-bottom: 16px; text-align: center;"
                        Ostatni projekt był aktualizowany ${daysSinceLast} dni temu - warto może dodać cos nowego?
                    </p>
                `;
            } else{
                summaryMsg = `
                    <p style="color: lightgreen; margin-top: 16px; margin-bottom: 16px; text-align: center;">
                        Super, ostatni projekt był aktualizowany ${daysSinceLast} dni temu!
                    </p>
                `;
            }
        }

        //show data to a user
        result.innerHTML = `
            <div class="card">
                <img src="${user.avatar_url}" alt="Avatar"  class="avatar">
                <h2>${user.login}</h2>
                <ul>
                    <li>Liczba repozytoriów: <strong>${total}</strong></li>
                    <li>Top języki: <strong>${topLangs}</strong></li>
                    <li>Ostatnia aktywność: <strong>${lastAct}</strong></li>
                    <li>% z opisem: <strong>${pctDesc}%</strong></li>
                </ul>
            </div>
            ${summaryMsg}
        `;
    } catch(err) {
        result.innerHTML += `<p style="color: red">Błąd: ${err.message}</p>`;
    }
}