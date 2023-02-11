/*
lerpw--color--i-1000px--rgbL255C0C0R--f-500px--rgbL0C255C20R--ends 
lerpw--transform--i-1000px--rotateL0degR_scaleL1R--f-500px--rotateL360degR_scaleL0R--ends 
*/

let lerpws = {};

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

function lerp(vi, vf, w, init_w, final_w) {
    let p = (w - init_w) / (final_w - init_w);
    return {
        p,
        lerp: (vf - vi) * p + vi,
        lerp_end: p < 0 ? vi : p > 1 ? vf : (vf - vi) * p + vi,
    };
}

function generateStyleCSS_lerpw() {
    lerpws = {};

    document.querySelectorAll("*").forEach(function (node) {
        let clases = Array.from(node.classList);
        for (const clase of clases) {
            if (/lerpw--.+--i-\d+D?\d*px-.+--f-\d+D?\d*px-.+--.+/.test(clase)) {
                if (lerpws[clase]) {
                    continue
                }
                let input = clase;
                for (const r in replaces) {
                    input = input.replaceAll(r, replaces[r]);
                }
                let sections = input.split("--");
                let property = sections[1];
                let init_w = +sections[2].replace("i-", "").replace("px", "");
                let init_value = sections[3].replaceAll("_", " ");
                let final_w = +sections[4].replace("f-", "").replace("px", "");
                let final_value = sections[5].replaceAll("_", " ");
                let type = sections[6];
                lerpws[clase] = {
                    property,
                    init_w,
                    init_value,
                    final_w,
                    final_value,
                    type,
                };
            }
        }
    });

    let w = window.innerWidth;
    let html = "";

    for (const clase in lerpws) {
        let claseObj = lerpws[clase];
        let { init_w, final_w, init_value, final_value, type } = claseObj;
        let init_value_indexes_numbers_of_lerp = [];
        let final_value_indexes_numbers_of_lerp = [];
        const regex = /\d+\.?\d*/g;
        {
            let ocurrencia;
            let start_index;
            let end_index;
            while ((ocurrencia = regex.exec(init_value)) !== null) {
                start_index = regex.lastIndex - ocurrencia[0].length;
                end_index = regex.lastIndex - 1;
                init_value_indexes_numbers_of_lerp.push({
                    start_index,
                    end_index,
                    value: +init_value.substring(start_index, end_index + 1),
                });
            }
        }
        {
            let ocurrencia;
            let start_index;
            let end_index;
            while ((ocurrencia = regex.exec(final_value)) !== null) {
                start_index = regex.lastIndex - ocurrencia[0].length;
                end_index = regex.lastIndex - 1;
                final_value_indexes_numbers_of_lerp.push({
                    start_index,
                    end_index,
                    value: +final_value.substring(start_index, end_index + 1),
                });
            }
        }
        let lineal_interpolation_between_init_and_final = [];

        for (const i in init_value_indexes_numbers_of_lerp) {
            let init = init_value_indexes_numbers_of_lerp[i].value;
            let final = final_value_indexes_numbers_of_lerp[i].value;
            let index_init = init_value_indexes_numbers_of_lerp[i].start_index;
            let index_final = init_value_indexes_numbers_of_lerp[i].end_index;
            let interpolation;
            interpolation = lerp(init, final, w, init_w, final_w);
            lineal_interpolation_between_init_and_final.push({
                p: interpolation.p,
                new_value_end: interpolation.lerp_end,
                new_value_projection: interpolation.lerp,
                start_index: index_init,
                end_index: index_final,
            });
        }
        let percent = lineal_interpolation_between_init_and_final[0].p

        if (type == "between" && (percent < 0 || percent > 1)) {
            continue
        }
        if (/less(-.+)?-(ends|projection|none)_up(-.+)?-(ends|projection|none)/.test(type)) {
            let args = type.split("_");
            let less = args[0]
            let up = args[1]
            let args_less = less.split("-")
            let args_up = up.split("-")
            if (args_less.length == 2) {
                if (w < Math.min(init_w, final_w)) {
                    type = args_less[1]
                }
            } else {
                let wi = +args_less[1].replace("px", "")
                if (w < wi) {
                    type = args_less[2]
                }
            }
            if (args_up.length == 2) {
                if (w > Math.max(init_w, final_w)) {
                    type = args_up[1]
                }
            } else {
                let wf = +args_up[1].replace("px", "")
                if (w > wf) {
                    type = args_up[2]
                }
            }
        }
        if (type == "none") {
            continue
        }
        lineal_interpolation_between_init_and_final.reverse();
        let new_state_css_lerped = init_value;
        for (const l of lineal_interpolation_between_init_and_final) {
            let new_value
            switch (type) {
                case "projection":
                    new_value = l.new_value_projection
                    break
                default:
                case "ends":
                    new_value = l.new_value_end
                    break
            }
            let left_string = new_state_css_lerped.substring(0, l.start_index);
            let right_string = new_state_css_lerped.substring(
                l.end_index + 1,
                new_state_css_lerped.length
            );
            new_state_css_lerped = left_string + new_value + right_string;
        }
        html += `
              .${clase}{
                  ${claseObj.property}:${new_state_css_lerped} !important
              }
          `;
    }

    return html;
}