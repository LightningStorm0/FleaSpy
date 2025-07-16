fetch('https://api.tarkov.dev/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({query: `{
        items(lang: en) {
            id
            name
            shortName
            iconLink
            sellFor {
              source
              priceRUB
            }
            height
            width
            types
        }
    }`})
  })
    .then(r => r.json())
    .then(function(data) {
        sortData(data);
    });

function sortData(data) {
    items = [];

    for (itemNo in data["data"]["items"]) {
        item = data["data"]["items"][itemNo];

        source = 'flea';
        highest = 0;

        for (sellForNo in item['sellFor']) {
            sellFor = item['sellFor'][sellForNo];

            if (highest == 0 || sellFor['priceRUB'] > highest) {
                if (sellFor['source'] != 'FLEAMARKET') { //ADDED SINCE FLEA IS DISABLED THIS WIPE
                    highest = sellFor['priceRUB'];
                    source = sellFor['source'];
                }
            }
        }

        fullValue = highest;

        if (highest != 0) {
            highest /= item['height'] * item['width'];
            highest = Math.round(highest);
        }
        
        item_data = {
            "shortName" : item['shortName'],
            "name": item['name'],
            "iconLink": item['iconLink'],
            "highest": highest,
            "fullValue": fullValue,
            "source": source,
            "types": item["types"]
        };

        if (highest != 0) {
            index = 0;

            while (items.length > index && items[index]['highest'] > highest) {
                index += 1;
            }

            items.splice(index, 0, item_data);
        }
    }

    types = {};

    for (itemNo in items) {
        item = items[itemNo];

        for (thisTypeNo in item["types"]) {
            thisType = item["types"][thisTypeNo];

            if (Object.keys(types).includes(thisType)) {
                types[thisType].push(item);
            } else {
                types[thisType] = [item];
            }
        }
    }

    typeValues = {};

    for (thisTypeNo in Object.keys(types)) {
        thisType = Object.keys(types)[thisTypeNo];

        count = 0;
        value = 0;

        for (itemNo in types[thisType]) {
            item = types[thisType][itemNo];

            count += 1;
            value += item["highest"];
        }

        typeValues[thisType] = Math.round(value/count);
    }

    sortedValues = [];

    while (Object.keys(typeValues).length > 0) {
        largest = -1;
        
        for (vNo in Object.values(typeValues)) {
            largest = Math.max(largest, Object.values(typeValues)[vNo]);
        }

        pop = "";

        for (kNo in Object.keys(typeValues)) {
            k = Object.keys(typeValues)[kNo];

            if (typeValues[k] == largest) {
                sortedValues.push(k);
                pop = k;
            }
        }
        delete typeValues[pop];
    }

    renderPage(sortedValues, types);
    update_cards();
}

function renderPage(sortedValues, types) {
    sidebar = document.getElementById("sidebar");

    console.log(sortedValues);
    console.log(types);

    for (tNo in sortedValues) {
        t = sortedValues[tNo];
        
        //child = '<a class="navigation" style="text-decoration: none" href="#' + t.toUpperCase() + '"> ' + t.toUpperCase() + ' </a>'
        
        const child = document.createElement("a");
        child.classList = ["navigation"];
        child.style = "text-decoration: none";
        child.href = "#" + t.toUpperCase();
        child.innerText = t.toUpperCase();

        sidebar.appendChild(child);
    }

    for (tNo in sortedValues) {
        t = sortedValues[tNo];

        items = types[t];

        const child1 = document.createElement("h1");
        child1.id = t.toUpperCase();
        child1.innerText = t.toUpperCase();

        document.body.appendChild(child1);

        const container = document.createElement("div");
        container.classList = ["container"];

        for (itemNo in items) {
            item = items[itemNo];

            const itemPicture = document.createElement("div");
            itemPicture.dataset.value = item['highest'].toString();
            itemPicture.classList = ["card"];
            itemPicture.style = 'background-image: url(' + item["iconLink"] + ');';
            itemPicture.title = item['name'];

            const name = document.createElement("div");
            name.innerText = item["shortName"];
            itemPicture.appendChild(name);

            const spacer = document.createElement("div");
            spacer.style = "flex-grow: 4;";
            itemPicture.appendChild(spacer);

            const source = document.createElement("div");
            source.style = "color: #777777; font-size: 8pt;";
            source.innerText = item["source"].toUpperCase();
            itemPicture.appendChild(source);

            const highest = document.createElement("div");
            highest.style = "color: #bbbbbb; font-size: 8pt;";
            highest.innerText = "₽ " + item["highest"].toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
            itemPicture.appendChild(highest);

            if (item["highest"] != item["fullValue"]) {
                const full = document.createElement("div");
                full.style = "color: #bbbbbb; font-size: 8pt;";
                full.innerText = "( ₽ " + item["fullValue"].toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + " )";
                itemPicture.appendChild(full);
            }

            container.appendChild(itemPicture);
        }

        document.body.appendChild(container);
    }
}

function update_cards() {
    var cusid_ele = document.getElementsByClassName('card');
    var cutoff = document.getElementById('amountCutoff');
    
    console.log(cutoff.value);
    
    for (var i = 0; i < cusid_ele.length; ++i) {
        var item = cusid_ele[i];  
        if (Number(item.dataset.value) < Number(cutoff.value)) {
            item.style.display = 'none';
        } else {
            item.style.display = 'flex';
        }
    }
    
    document.getElementById('cutoffLabel').innerHTML = "₽ " + String(cutoff.value);
}
