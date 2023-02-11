/*
forma general
[nombre de la función]--[propiedad css a ajustar]--[valor si verdadero]--if-[discriminador]-[tamaño de ancho]px-else--[valor si falso]

Ejemplo
switchw--width--100P--if-up-1200px-else--47P
*/

let switchws = {};

replaces = {
    A: "*", //asterisc
    S: "/", //slash
    P: "%", //porcent
    L: "(", //leftBracket
    R: ")", //rightBracket
    C: ",", //comma
    D: ".", //dot
    M: "+", //more
    H: "#", //hash
};

post_replaces = {
    G: "--", //guión (doble)
}

let style_responsive_switchws = document.createElement("style");
(document.head || document.getElementsByTagName("head")[0]).appendChild(style_responsive_switchws);

function extractInfoOfClase_switchw(clase){
    if (/switchw--.+--.+--if-(less|up|between)-\d+D?\d*px(-\d+D?\d*px)?-else--.+/.test(clase)) {
        if (switchws[clase]) {
            return
        }
        let input = clase;
        for (const r in replaces) {
            input = input.replaceAll(r, replaces[r]);
        }
        let sections = input.split("--");
        let property_css_to_fit = sections[1];
        let property_css_if_true = sections[2].replaceAll("_", " ");
        let condition = sections[3];
        let sections_condition = condition.split("-");
        let discriminador = sections_condition[1];
        let arg1_size_width_to_discriminate = sections_condition[2];
        let arg2_size_width_to_discriminate = sections_condition[3];
        let property_css_if_false = sections[4].replaceAll("_", " ");
        for (const r in post_replaces) {
            property_css_if_false = property_css_if_false.replaceAll(r, post_replaces[r])
            property_css_if_true = property_css_if_true.replaceAll(r, post_replaces[r])
        }
        switchws[clase] = {
            property_css_to_fit,
            property_css_if_true,
            property_css_if_false,
            discriminador,
            arg1_size_width_to_discriminate,
            arg2_size_width_to_discriminate,
        };
    }
}

function generateStyleCSS_switchw() {
    switchws = {};

    extractInfoOfClases(extractInfoOfClase_switchw)

    let html = "";

    let set1 = {}
    let set2 = {}

    for (const clase in switchws) {
        let claseObj = switchws[clase];
        let {
            discriminador,
            arg1_size_width_to_discriminate,
            arg2_size_width_to_discriminate,
        } = claseObj;
        claseObj.clase = clase

        if (["less", "up"].includes(discriminador)) {
            if (!set1[arg1_size_width_to_discriminate]) {
                set1[arg1_size_width_to_discriminate] = []
            }
            set1[arg1_size_width_to_discriminate].push(claseObj)
        }
        if (discriminador == "between") {
            if (!set2[arg1_size_width_to_discriminate]) {
                set2[arg1_size_width_to_discriminate] = {}
            }
            if (!set2[arg1_size_width_to_discriminate][arg2_size_width_to_discriminate]) {
                set2[arg1_size_width_to_discriminate][arg2_size_width_to_discriminate] = []
            }
            set2[arg1_size_width_to_discriminate][arg2_size_width_to_discriminate].push(claseObj)
        }
    }

    let set1_min = {}
    let set1_max = {}

    for (const arg1 in set1) {
        set1[arg1].forEach((el) => {
            if (!set1_min[arg1]) {
                set1_min[arg1] = []
            }
            if (!set1_max[arg1]) {
                set1_max[arg1] = []
            }
            set1_min[arg1].push(`
                .${el.clase}{
                    ${el.property_css_to_fit}: ${el.discriminador == "less" ? el.property_css_if_true : el.property_css_if_false} !important;
                }
            `)
            set1_max[arg1].push(`
                .${el.clase}{
                    ${el.property_css_to_fit}: ${el.discriminador == "up" ? el.property_css_if_true : el.property_css_if_false} !important;
                }
            `)
        })
    }
    for (const arg1 in set1) {
        html += `
            @media (max-width: ${arg1}) {
                ${set1_min[arg1].join("\n")}
            }
            @media (min-width: ${arg1}) {
                ${set1_max[arg1].join("\n")}
            }
        `;
    }

    let bet = {}
    let left = {}
    let right = {}

    let keys_left = new Set()
    let keys_right = new Set()

    for (const k_left in set2) {
        for (const k_right in set2[k_left]) {
            keys_left.add(k_left)
            keys_right.add(k_right)
            set2[k_left][k_right].forEach((el) => {
                if (!bet[k_left][k_right]) {
                    bet[k_left][k_right] = []
                }
                if (!left[k_left]) {
                    left[k_left] = []
                }
                if (!right[k_right]) {
                    right[k_right] = []
                }
                bet[k_left][k_right].push(`
                    .${el.clase}{
                        ${el.property_css_to_fit}: ${el.property_css_if_true} !important;
                    }
                `)
                left[k_left].push(`
                    .${el.clase}{
                        ${el.property_css_to_fit}: ${el.property_css_if_false} !important;
                    }
                `)
                right[k_right].push(`
                    .${el.clase}{
                        ${el.property_css_to_fit}: ${el.property_css_if_false} !important;
                    }
                `)
            })
        }
    }

    keys_left = [...keys_left]
    keys_right = [...keys_right]

    for (const arg1 of keys_left) {
        for (const arg2 of keys_right) {
            html += `
                @media (min-width: ${arg1}) and (max-width: ${arg2}) {
                    ${bet[arg1][arg2].join("\n")}
                }
            `;
        }
    }

    for (const arg1 of keys_right) {
        html+=`
            @media (min-width: 0) and (max-width: ${arg1}) {
                ${left[arg1].join("\n")}
            }
        `        
    }

    for (const arg2 of keys_right) {
        html+=`
            @media (min-width: ${arg2}) and (max-width: 999999px) {
                ${right[arg2].join("\n")}
            }
        `        
    }
    return html
}