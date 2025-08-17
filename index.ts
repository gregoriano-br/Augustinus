function convertExsurge(input: string): string {
    let result: string = input;
    result = result.replaceAll("<c><sp>V/</sp>.</c>", "<c><sp>V/</sp></c>");
    result = result.replaceAll("<c><sp>R/</sp>.</c>", "<c><sp>V/</sp></c>");
    result = result.replaceAll("<nlba>", "");
    return result;
}