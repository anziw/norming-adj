var trial_counter = 0;

function build_trials() {
  var trials = _.shuffle(items.map(function(item) {
    return _.sample(item.conditions);
  }));
  var midpoint = Math.floor(trials.length / 2);
  trials.splice(midpoint, 0, {is_attention_check: true});
  return trials;
}

function make_slides(f) {
  var slides = {};

  slides.consent = slide({
    name: "consent",
    button: function() {
      exp.go();
    }
  });

  slides.welcome = slide({
    name: "welcome",
    start: function() {
      exp.startT = Date.now();
    }
  });

  slides.instructions = slide({
    name: "instructions",
    button: function() {
      exp.go();
    }
  });

  slides.trial = slide({
    name: "trial",
    present: exp.train_stims,
    present_handle: function(stim) {
      this.stim = stim;
      this.trialStartT = Date.now();
      if (stim.is_attention_check) {
        $("#trial-question").text('Please click on the option "No".');
      } else {
        $("#trial-question").text(stim.question);
      }
    },
    button: function(response) {
      var rt = Date.now() - this.trialStartT;
      if (this.stim.is_attention_check) {
        exp.catch_trials.push({
          "trial_type": "attention_check",
          "response": response,
          "passed": response === "No",
          "rt": rt
        });
        _stream.apply(this);
        return;
      }
      exp.data_trials.push({
        "trial_id": this.stim.trial_id,
        "item": this.stim.item,
        "condition": this.stim.condition,
        "question": this.stim.question,
        "response": response,
        "rt": rt,
        "trial_no": trial_counter
      });
      trial_counter++;
      _stream.apply(this);
    }
  });

  slides.subj_info = slide({
    name: "subj_info",
    submit: function(e) {
      exp.subj_data = {
        language: $("#language").val(),
        name: $("#name").val(),
        gender: $("#gender").val(),
        tirednesslvl: $("#tirednesslvl").val(),
        age: $("#age").val()
      };
      exp.go();
    }
  });

  slides.thanks = slide({
    name: "thanks",
    start: function() {
      exp.data = {
        "trials": exp.data_trials,
        "catch_trials": exp.catch_trials,
        "system": exp.system,
        "condition": exp.condition,
        "subject_information": exp.subj_data,
        "yes_left": exp.yes_left,
        "time_in_minutes": (Date.now() - exp.startT) / 60000
      };
      proliferate.submit(exp.data);
    }
  });

  return slides;
}

function init() {
  exp.trials = [];
  exp.catch_trials = [];
  exp.train_stims = build_trials();
  exp.system = {
    Browser: BrowserDetect.browser,
    OS: BrowserDetect.OS,
    screenH: screen.height,
    screenUH: exp.height,
    screenW: screen.width,
    screenUW: exp.width
  };
  exp.structure = ["consent", "welcome", "instructions", "trial", "subj_info", "thanks"];

  exp.data_trials = [];
  exp.yes_left = Math.random() < 0.5;
  var $btns = $("#response-buttons");
  if (!exp.yes_left) {
    $btns.append($btns.find("input[value='Yes']"));
  }
  exp.slides = make_slides(exp);

  exp.nQs = utils.get_exp_length();

  $('.slide').hide();

  $("#start_button").click(function() {
    if (turk.previewMode) {
      $("#mustaccept").show();
    } else {
      $("#start_button").click(function() { $("#mustaccept").show(); });
      exp.go();
    }
  });

  $(".response-buttons").click(function() {
    _s.button($(this).val());
  });

  exp.go();
}
