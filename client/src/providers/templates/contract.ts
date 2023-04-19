import { SnippetString } from 'vscode';
const pad20 = value => new String(value).padStart(2, '0');
const date_initial = new Date();
const date_final = new Date(Date.now() + 3600 * 1000 * 24);

export const templateContract1 = new SnippetString(`contract \${1:contractName} {
	variables {
		// Add variables
	}

	dates {
		beginDate = \${4:${date_initial.getFullYear()}-${pad20(
    date_initial.getMonth() + 1,
)}-${pad20(date_initial.getDate())}} \${5:${pad20(date_initial.getHours())}:${pad20(
    date_initial.getMinutes(),
)}:${pad20(date_initial.getSeconds())}}
		dueDate = \${6:${date_final.getFullYear()}-${pad20(
    date_final.getMonth() + 1,
)}-${pad20(date_final.getDate())}} \${7:${pad20(date_final.getHours())}:${pad20(
    date_final.getMinutes(),
)}:${pad20(date_final.getSeconds())}}
	}

	parties {
		application = "\${8:application name}"
		process = "\${9:process name}"
	}

	clauses {
		\${10|right,obligation,prohibition|} \${11:clauseName} {
			rolePlayer = \${12|application,process|}
			operation = \${13|push,poll,read,write,request,response|}

			terms {
				// Add terms
				\${14} 
			}
		}
	}
}`);

export const templateContract2 = new SnippetString(`contract \${1:contractName} {
	variables {
		// Add variables
	}

	dates {
		beginDate = \${4:${date_initial.getFullYear()}-${pad20(
    date_initial.getMonth() + 1,
)}-${pad20(date_initial.getDate())}} \${5:${pad20(date_initial.getHours())}:${pad20(
    date_initial.getMinutes(),
)}:${pad20(date_initial.getSeconds())}}
		dueDate = \${6:${date_final.getFullYear()}-${pad20(
    date_final.getMonth() + 1,
)}-${pad20(date_final.getDate())}} \${7:${pad20(date_final.getHours())}:${pad20(
    date_final.getMinutes(),
)}:${pad20(date_final.getSeconds())}}
	}

	parties {
		application = "\${8:application name}"
		process = "\${9:process name}"
	}

	clauses {
		\${10|right,obligation,prohibition|} \${11:clauseName} {
			rolePlayer = \${12|application,process|}
			operation = \${13|push,poll,read,write,request,response|}

			terms {
				WeekDaysInterval(\${14|Monday,Tuesday,Wednesday,Thursday,Friday,Saturday,Sunday|} to \${15|Monday,Tuesday,Wednesday,Thursday,Friday,Saturday,Sunday|}),
				TimeInterval(\${16:00:00:00} to \${17:23:59:59}),
				Timeout(\${18:180}),
				MaxNumberOfOperation(\${19:0} per \${20|Second,Hour,Minute,Day,Week,Month|}),
				MessageContent("\${21:A message content}")
			}

			onBreach(\${22:log("\${23}")})
		}

		\${24|obligation,right,prohibition|} \${25:clauseName} {
			rolePlayer = \${26|application,process|}
			operation = \${27|push,poll,read,write,request,response|}

			terms {
				WeekDaysInterval(\${28|Monday,Tuesday,Wednesday,Thursday,Friday,Saturday,Sunday|} to \${29|Monday,Tuesday,Wednesday,Thursday,Friday,Saturday,Sunday|}),
				TimeInterval(\${30:00:00:00} to \${31:23:59:59}),
				Timeout(\${32:180}),
				MaxNumberOfOperation(\${33:0} per \${34|Second,Hour,Minute,Day,Week,Month|}),
				MessageContent("\${35:A message content}")
			}

			onBreach(\${36:log("\${37:A log message}")})
		}

		\${38|prohibition,right,obligation|} \${39:clauseName} {
			rolePlayer = \${40|application,process|}
			operation = \${41|push,poll,read,write,request,response|}

			terms {
				WeekDaysInterval(\${42|Monday,Tuesday,Wednesday,Thursday,Friday,Saturday,Sunday|} to \${43|Monday,Tuesday,Wednesday,Thursday,Friday,Saturday,Sunday|}),
				TimeInterval(\${44:00:00:00} to \${45:23:59:59}),
				Timeout(\${46:180}),
				MaxNumberOfOperation(\${47:0} per \${48|Second,Hour,Minute,Day,Week,Month|}),
				MessageContent("\${49:A message content}")
			}

			onBreach(\${50:log("\${51:A log message}")})
		}
	}
}`);
