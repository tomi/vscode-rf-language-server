export class TestData {

}

export class DataTable {
    private header: string;

    constructor(private parent: TestData) {

    }
}

export class VariableTable extends DataTable {

}

export class KeywordTable extends DataTable {

}

export class SettingsTable extends DataTable {

}

export class TestCaseTable extends DataTable {

}
