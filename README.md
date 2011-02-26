go to http://littlescript.the.tl
A programming language to code on a mobile phone.
Based of GOTOs and Global variables.

Control is a first class citizen.
http://en.wikipedia.org/wiki/Control_flow



#variable assignment

    my_number = 1
    person = {}
    arr = []
    other_arr = arr
    url = string http://twitter.com/drewlesueur
    other_string = " this is a string too

#objects and arrays

    name = string Drew LeSueur
    person = {}
    person.name = name
    prop = "height"
    person..prop = string 5'8

    awards = []
    awards.0 = " my first award
    awards.1 = []
    awards.1.0 = " second award a
    awards.1.1 = " scond award b

#if
    x = 1
    if x is 1
      s = string yes, x is 1
      log s
    end

    y = 0
    if y
      s = string y is truthy
      log s
    else
      s = string y is falsy
      log s
    end

#functions

    def call_me
      string 480-840-5406
    end

    phone = call_me !

    log phone


    def hello name
      log name
    end

    my_name = string Drew LeSueur
    hello my_name

    def test_args
      log args.0
      log args.1
    end


    test_args 1 3 6

# javascript
Use the `scope` variable
`scope.so` is the return value

    def concat
      ` scope.so = scope.args.join("")
    end

    s = string My name is
    name = string Drew LeSuuer

    sentence = concat s name
    log sentence


#goto, label, ifgoto, and exit
If you want to instead of functions

    x = 1
    ifgoto x xgood
    goto xnotgood

    label xgood
    log "x_is_truthy"
    goto quit

    lable xnotgood
    log "x_is_falsy"
    goto quit


    label quit
    exit
    #exit exits the program


#Comments

    #comments are made with the # character
    # setting x to "wowser"
    x = string wowser


