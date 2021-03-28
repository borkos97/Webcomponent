class TableComponent extends HTMLElement {
    constructor() {
        super();
        this.data = [];
        this.sortType = true;
    }

    static get observedAttributes() {
        return [];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        console.log(`Changed ${name} from ${oldValue} to ${newValue}`);
    }

    async connectedCallback() {
        let attributes = this.getAttributeNames().map(
            (attr) => {
                return {'attribute': attr, 'value': this.getAttribute(attr)}
            });

        this.columnsNames = attributes.find(name => name.attribute === 'columns').value.split(',');
        this.summaryNames = attributes.find(name => name.attribute === 'summary').value.split(',');
        this.fillDataRules = attributes.find(name => name.attribute === 'fill-data-rules').value.split(',');
        if (this.columnsNames.length < 2) {
            alert("Niepoprawny atrybut 'columns'. Atrybut powinien skłądać się z przynajmniej dwóch nazw");
        } else if (!this.summaryNames.every(name => name === 'none' || name === 'count' || name === 'avg' || name === 'sum')) {
            alert("Wykryto nieznany typ podsumowania. Dozwolone typy to: none, count, avg, sum")
        } else {
            this.data = await fetch('data.json').then(response => response.json()).then(data => data);
            await this.generateTable();
        }
    }

    generateTable() {
        this.table = document.createElement('table');

        this.header = this.generateHeader();

        this.dataNode = document.createElement("tbody");
        this.fillData();
        this.generateData();

        this.footer = this.generateFooter();

        this.table.appendChild(this.header);
        this.table.appendChild(this.dataNode);
        this.table.appendChild(this.footer);

        this.appendChild(this.table);
    }

    generateHeader() {
        const row = document.createElement("thead");
        const columns = Object.keys(this.data[0]);
        const headers = this.columnsNames.map((columnName, index) => {
            const element = document.createElement("th");
            element.innerText = columnName;
            const btn = document.createElement(`button`);
            btn.innerHTML = `<i class="fas fa-sort"></i>`;
            btn.className = `sort`;
            btn.onclick = (() => this.handleSortClick(columns, index));
            element.appendChild(btn);
            return element;
        })
        for (const header of headers) {
            row.appendChild(header);
        }
        return row;
    }

    fillData() {
        const keys = Object.keys(this.data[0]);
        for (const element of this.fillDataRules) {
            const [columnIndex, firstValueIndex, secondValueIndex] = element.split(/[=|\/*]/);
            const sign = element.split(/[0-9=|]/).find(element => element !== '');
            for (const row of this.data) {
                if (row[keys[columnIndex]] === null) {
                    if (sign === '/') {
                        row[keys[columnIndex]] = row[keys[firstValueIndex]] / row[keys[secondValueIndex]];
                    } else if (sign === '*') {
                        row[keys[columnIndex]] = row[keys[firstValueIndex]] * row[keys[secondValueIndex]];
                    } else row[keys[columnIndex]] = '#SIGN!'
                }
            }
        }
    }

    generateData() {
        this.dataNode.innerHTML = ''
        for (const row of this.data) {
            const node = this.generateRecord(row);
            this.dataNode.appendChild(node);
        }
    }

    generateRecord(data) {
        const row = document.createElement("tr");
        const cells = Object.keys(data).map(key => {
            const cell = document.createElement("td");
            cell.innerText = data[key];
            return cell;
        })
        for (const cell of cells) {
            row.appendChild(cell);
        }
        return row;
    }

    generateFooter() {
        const row = document.createElement("tfoot");
        row.className = "summary";
        const keys = Object.keys(this.data[0]);
        for (const [i, name] of Object.entries(this.summaryNames)) {
            const newNode = document.createElement('td');
            const column = this.data.map(d => d[keys[i]]);
            if (name === 'count') {
                newNode.innerText = new Set(column).size.toString();
            } else if (name === 'avg') {
                newNode.innerText = (Math.round(column.reduce((a, b) => a + b, 0) / column.length)).toString()

            } else if (name === 'sum') {
                newNode.innerText = (column.reduce((a, b) => a + b, 0)).toString()

            } else {
                newNode.innerText = "-----"
            }
            row.appendChild(newNode)
        }
        return row;
    }

    disconnectedCallback() {
        console.log(`Disconnecting!`);
        this.destroy();
    }

    destroy() {
        this.innerHTML = '';
    }

    handleSortClick = (columns, index) => {
        this.sortType = !this.sortType
        this.data.sort((a, b) => {
            let x = a[columns[index]]
            let y = b[columns[index]]
            if (!this.sortType) {
                if (typeof x !== "string" && y !== "string") return x - y
                else return (x < y) ? -1 : (x > y) ? 1 : 0;
            } else if (this.sortType) {
                if (typeof x !== "string" && y !== "string") return y - x
                else return (x > y) ? -1 : (x < y) ? 1 : 0;
            }
        })
        this.generateData()
    }
}

customElements.define('table-component', TableComponent);