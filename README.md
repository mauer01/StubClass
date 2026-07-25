Provides a full stub implementation for a given type. It allows for overriding
methods with custom functions and interacting with the stub catalog.

2 Primary Usage Patterns

when a type has no Attributes

```ts
type A = {
  methodA: () => void;
};
const stubA = new StubFullType<A>(["methodA"]),
  stubAToo = StubFullType._create<A>(["methodA"]);
```

when a type has Attributes

```ts
type A = {
  methodA: () => void;
};
type B = { b: A; methodB: () => void };

class StubbedB extends StubFullType<B> {
  b: Stubbed<A>;

  constructor() {
    super(["methodB"]);
    this.b = StubFullType._create<A>(["methodA"]);
  }

  override reset(trueReset: boolean) {
    this.b.reset(trueReset);
    super.reset(trueReset);
  }
}

const stubB = new StubbedB();
```

Following the complete stub for the Hono Context Type

```ts
class StubbedContext extends StubFullType<Context> {
  req: Stubbed<HonoRequest> & {
    raw: TestRequest["raw"] & { headers: Raw["headers"] };
  };
  res: Stubbed<Context["res"]>;

  private constructor() {
    super([
      "body",
      "status",
      "setRenderer",
      "setLayout",
      "text",
      "set",
      "render",
      "redirect",
      "notFound",
      "newResponse",
      "json",
      "html",
      "header",
      "getLayout",
      "get",
      "env",
    ]);
    this.req = TestRequest.create();
    this.res = StubFullType._create<Stubbed<Context["res"]>>([
      "text",
      "clone",
      "bytes",
      "json",
      "formData",
      "blob",
      "arrayBuffer",
    ]);
  }

  static create() {
    return new TestContext() as Stubbed<Context> & {
      req: TestContext["req"] & { raw: TestRequest["raw"] };
      res: TestContext["res"];
    };
  }

  override reset(trueReset?: true) {
    this.req.reset(trueReset);
    this.res.reset(trueReset);
    super.reset(trueReset);
  }
}

class TestRequest extends StubFullType<HonoRequest> {
  raw: Stubbed<HonoRequest["raw"]> & {
    headers: Stubbed<HonoRequest["raw"]["headers"]>;
  };

  private constructor() {
    super([
      "header",
      "valid",
      "query",
      "queries",
      "parseBody",
      "param",
      "formData",
      "blob",
      "arrayBuffer",
      "addValidatedData",
      "text",
      "json",
    ]);
    this.raw = Raw.create();
  }

  static create(): Stubbed<HonoRequest> & {
    raw: Stubbed<HonoRequest["raw"]> & {
      headers: Stubbed<HonoRequest["raw"]["headers"]>;
    };
  } {
    return new TestRequest();
  }
}

class Raw extends StubFullType<HonoRequest["raw"]> {
  headers: Stubbed<HonoRequest["raw"]["headers"]>;

  private constructor() {
    super();
    this.headers = StubFullType._create<Stubbed<HonoRequest["raw"]["headers"]>>(
      ["get"],
    );
  }

  static create(): Stubbed<HonoRequest["raw"]> & {
    headers: Stubbed<HonoRequest["raw"]["headers"]>;
  } {
    return new Raw();
  }
}
```
